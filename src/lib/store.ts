'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  AppState, Player, TeamEvent, Attendance, Callup, Announcement, MatchStat,
  AttendanceStatus, UserRole,
} from './types'
import {
  seedTeam, seedPlayers, seedEvents, seedAttendances, seedCallups,
  seedAnnouncements, seedMatchStats, seedStandings,
} from './seed-data'

interface StoreActions {
  // Vista activa
  setActiveView: (view: string) => void
  setSelectedEventId: (id: string | null) => void

  // Asistencia
  setAttendance: (eventId: string, playerId: string, status: AttendanceStatus) => void

  // Convocatoria
  toggleCallup: (eventId: string, playerId: string) => void
  setStarter: (eventId: string, playerId: string) => void
  setSubstitute: (eventId: string, playerId: string) => void
  removePlayerFromCallup: (eventId: string, playerId: string) => void
  setCaptain: (eventId: string, playerId: string) => void
  setFormation: (eventId: string, formation: string) => void
  setPlayerPosition: (eventId: string, playerId: string, position: string) => void

  // Avisos
  markAnnouncementRead: (announcementId: string, playerId: string) => void
  togglePinAnnouncement: (announcementId: string) => void
  addAnnouncement: (data: Omit<Announcement, 'id' | 'date' | 'readBy'>) => void

  // Eventos
  addEvent: (data: Omit<TeamEvent, 'id' | 'status'>) => void
  updateEvent: (id: string, data: Partial<TeamEvent>) => void
  setMatchResult: (eventId: string, homeScore: number, awayScore: number) => void

  // Estadísticas de partido
  upsertMatchStat: (stat: MatchStat) => void
  setMotm: (eventId: string, playerId: string) => void

  // Jugadores
  updatePlayer: (id: string, data: Partial<Player>) => void
  addPlayer: (data: Omit<Player, 'id'>) => void

  // Utilidades
  resetData: () => void
}

type Store = AppState & StoreActions

const initialState: AppState = {
  team: seedTeam,
  players: seedPlayers,
  events: seedEvents,
  attendances: seedAttendances,
  callups: seedCallups,
  announcements: seedAnnouncements,
  matchStats: seedMatchStats,
  standings: seedStandings,
  currentUserId: 'p10',
  currentUserRole: 'entrenador',
  currentUserName: 'Carlos Mendoza',
  activeView: 'inicio',
  selectedEventId: null,
}

function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,

      setActiveView: (view) => set({ activeView: view }),
      setSelectedEventId: (id) => set({ selectedEventId: id }),

      setAttendance: (eventId, playerId, status) => {
        const existing = get().attendances.find(
          (a) => a.eventId === eventId && a.playerId === playerId
        )
        if (existing) {
          set({
            attendances: get().attendances.map((a) =>
              a.eventId === eventId && a.playerId === playerId
                ? { ...a, status, updatedAt: new Date().toISOString() }
                : a
            ),
          })
        } else {
          set({
            attendances: [
              ...get().attendances,
              { eventId, playerId, status, updatedAt: new Date().toISOString() },
            ],
          })
        }
      },

      toggleCallup: (eventId, playerId) => {
        const callup = get().callups.find((c) => c.eventId === eventId)
        if (!callup) {
          set({
            callups: [
              ...get().callups,
              {
                eventId,
                calledUpPlayerIds: [playerId],
                startingIds: [],
                substituteIds: [],
                formation: '4-3-3',
                positions: {},
              },
            ],
          })
          return
        }
        const isIn = callup.calledUpPlayerIds.includes(playerId)
        const newCalled = isIn
          ? callup.calledUpPlayerIds.filter((id) => id !== playerId)
          : [...callup.calledUpPlayerIds, playerId]
        const newStarting = callup.startingIds.filter((id) => id !== playerId)
        const newSubs = callup.substituteIds.filter((id) => id !== playerId)
        const newPositions = { ...callup.positions }
        delete newPositions[playerId]
        set({
          callups: get().callups.map((c) =>
            c.eventId === eventId
              ? { ...c, calledUpPlayerIds: newCalled, startingIds: newStarting, substituteIds: newSubs, positions: newPositions }
              : c
          ),
        })
      },

      setStarter: (eventId, playerId) => {
        set({
          callups: get().callups.map((c) => {
            if (c.eventId !== eventId) return c
            if (!c.calledUpPlayerIds.includes(playerId)) return c
            const newStarting = c.startingIds.includes(playerId)
              ? c.startingIds
              : [...c.startingIds, playerId]
            const newSubs = c.substituteIds.filter((id) => id !== playerId)
            return { ...c, startingIds: newStarting, substituteIds: newSubs }
          }),
        })
      },

      setSubstitute: (eventId, playerId) => {
        set({
          callups: get().callups.map((c) => {
            if (c.eventId !== eventId) return c
            if (!c.calledUpPlayerIds.includes(playerId)) return c
            const newSubs = c.substituteIds.includes(playerId)
              ? c.substituteIds
              : [...c.substituteIds, playerId]
            const newStarting = c.startingIds.filter((id) => id !== playerId)
            return { ...c, startingIds: newStarting, substituteIds: newSubs }
          }),
        })
      },

      removePlayerFromCallup: (eventId, playerId) => {
        set({
          callups: get().callups.map((c) => {
            if (c.eventId !== eventId) return c
            const newPositions = { ...c.positions }
            delete newPositions[playerId]
            return {
              ...c,
              calledUpPlayerIds: c.calledUpPlayerIds.filter((id) => id !== playerId),
              startingIds: c.startingIds.filter((id) => id !== playerId),
              substituteIds: c.substituteIds.filter((id) => id !== playerId),
              positions: newPositions,
              captainId: c.captainId === playerId ? undefined : c.captainId,
            }
          }),
        })
      },

      setCaptain: (eventId, playerId) => {
        set({
          callups: get().callups.map((c) =>
            c.eventId === eventId ? { ...c, captainId: playerId } : c
          ),
        })
      },

      setFormation: (eventId, formation) => {
        const callup = get().callups.find((c) => c.eventId === eventId)
        if (!callup) {
          set({
            callups: [
              ...get().callups,
              {
                eventId,
                calledUpPlayerIds: [],
                startingIds: [],
                substituteIds: [],
                formation,
                positions: {},
              },
            ],
          })
          return
        }
        set({
          callups: get().callups.map((c) =>
            c.eventId === eventId ? { ...c, formation } : c
          ),
        })
      },

      setPlayerPosition: (eventId, playerId, position) => {
        set({
          callups: get().callups.map((c) => {
            if (c.eventId !== eventId) return c
            const newPositions = { ...c.positions }
            if (position) newPositions[playerId] = position
            else delete newPositions[playerId]
            return { ...c, positions: newPositions }
          }),
        })
      },

      markAnnouncementRead: (announcementId, playerId) => {
        set({
          announcements: get().announcements.map((a) =>
            a.id === announcementId
              ? { ...a, readBy: a.readBy.includes(playerId) ? a.readBy : [...a.readBy, playerId] }
              : a
          ),
        })
      },

      togglePinAnnouncement: (announcementId) => {
        set({
          announcements: get().announcements.map((a) =>
            a.id === announcementId ? { ...a, pinned: !a.pinned } : a
          ),
        })
      },

      addAnnouncement: (data) => {
        const newAnn: Announcement = {
          ...data,
          id: uid('a'),
          date: new Date().toISOString(),
          readBy: [],
        }
        set({ announcements: [newAnn, ...get().announcements] })
      },

      addEvent: (data) => {
        const newEvent: TeamEvent = {
          ...data,
          id: uid('e'),
          status: 'programado',
        }
        set({ events: [...get().events, newEvent] })
      },

      updateEvent: (id, data) => {
        set({
          events: get().events.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })
      },

      setMatchResult: (eventId, homeScore, awayScore) => {
        set({
          events: get().events.map((e) =>
            e.id === eventId
              ? { ...e, homeScore, awayScore, status: 'completado' }
              : e
          ),
        })
      },

      upsertMatchStat: (stat) => {
        const existing = get().matchStats.find(
          (s) => s.eventId === stat.eventId && s.playerId === stat.playerId
        )
        if (existing) {
          set({
            matchStats: get().matchStats.map((s) =>
              s.id === existing.id ? { ...stat, id: existing.id } : s
            ),
          })
        } else {
          set({ matchStats: [...get().matchStats, stat] })
        }
      },

      setMotm: (eventId, playerId) => {
        set({
          matchStats: get().matchStats.map((s) =>
            s.eventId === eventId
              ? { ...s, isMotm: s.playerId === playerId }
              : s
          ),
        })
      },

      updatePlayer: (id, data) => {
        set({
          players: get().players.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })
      },

      addPlayer: (data) => {
        const newPlayer: Player = { ...data, id: uid('p') }
        set({ players: [...get().players, newPlayer] })
      },

      resetData: () => {
        set({ ...initialState })
      },
    }),
    {
      name: 'halcones-fc-store',
      version: 1,
    }
  )
)
