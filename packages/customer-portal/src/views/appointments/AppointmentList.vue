<template>
  <div class="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
    <div class="flex items-end justify-between">
      <div>
        <h1 class="font-serif text-3xl text-text mb-2">{{ t('appointments.title') }}</h1>
        <p class="text-sm text-text-muted">{{ t('appointments.subtitle') }}</p>
      </div>
      <button @click="openCreateDialog" class="px-5 py-2.5 text-sm font-bold text-obsidian bg-wealth rounded shadow-lg shadow-wealth/20 hover:shadow-wealth/40 transition-all flex items-center gap-2">
        <component :is="Plus" class="w-4 h-4" />
        {{ t('appointments.createAppointment') }}
      </button>
    </div>

    <div class="flex items-center gap-2 p-1 rounded-xl bg-glass/20 border border-white/5 w-fit">
      <button
        v-for="v in viewOptions"
        :key="v.value"
        @click="activeView = v.value"
        class="px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-2"
        :class="activeView === v.value ? 'bg-wealth text-obsidian font-bold shadow-lg shadow-wealth/20' : 'text-text-muted hover:text-text hover:bg-white/5'"
      >
        <component :is="v.icon" class="w-4 h-4" />
        {{ v.label }}
      </button>
    </div>

    <div v-if="loading" class="p-8 text-center bg-glass/20 border border-white/5 rounded-xl">
      <p class="text-text-muted animate-pulse">{{ t('appointments.loading') }}</p>
    </div>

    <template v-else>
      <div v-if="activeView === 'list'">
        <div v-if="appointments.length === 0" class="p-8 text-center bg-glass/10 border border-white/5 border-dashed rounded-xl">
          <component :is="Calendar" class="w-12 h-12 mx-auto mb-3 text-text-muted/40" />
          <p class="text-text-muted">{{ t('appointments.emptyTitle') }}</p>
          <p class="text-xs text-text-muted/60 mt-1">{{ t('appointments.emptyDesc') }}</p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="apt in appointments" :key="apt.id" class="p-6 rounded-xl bg-glass/20 border border-white/5 hover:border-wealth/30 transition-all">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="font-serif text-lg text-text">{{ apt.title || t('appointments.consultationAppointment') }}</h3>
                <p v-if="apt.description" class="text-xs text-text-muted mt-1 line-clamp-2">{{ apt.description }}</p>
              </div>
              <span class="px-2 py-1 rounded text-xs font-bold" :class="getStatusClass(apt.status)">
                {{ getStatusLabel(apt.status) }}
              </span>
            </div>
            <div class="space-y-2 mb-4">
              <div class="flex items-center gap-2 text-sm text-text-muted">
                <component :is="Calendar" class="w-4 h-4" />
                <span>{{ formatDate(apt.startTime) }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-text-muted">
                <component :is="Clock" class="w-4 h-4" />
                <span>{{ formatTime(apt.startTime) }} - {{ formatTime(apt.endTime) }}</span>
              </div>
              <div v-if="apt.user" class="flex items-center gap-2 text-sm text-text-muted">
                <component :is="UserIcon" class="w-4 h-4" />
                <span>{{ apt.user.name || t('appointments.dedicatedAdvisor') }}</span>
              </div>
            </div>
            <div class="flex gap-2 justify-end border-t border-white/5 pt-4">
              <button
                v-if="apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED'"
                @click="handleCancel(apt.id)"
                class="px-3 py-1.5 text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded transition-colors flex items-center gap-1"
              >
                <component :is="XCircle" class="w-3 h-3" />
                {{ t('appointments.cancelAppointment') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeView === 'week'">
        <div class="flex items-center justify-between mb-4">
          <button @click="changeWeek(-1)" class="p-2 rounded-lg bg-glass/20 border border-white/5 hover:border-wealth/30 text-text-muted hover:text-text transition-all">
            <component :is="ChevronLeft" class="w-5 h-5" />
          </button>
          <h2 class="font-serif text-lg text-text">{{ weekRangeLabel }}</h2>
          <button @click="changeWeek(1)" class="p-2 rounded-lg bg-glass/20 border border-white/5 hover:border-wealth/30 text-text-muted hover:text-text transition-all">
            <component :is="ChevronRight" class="w-5 h-5" />
          </button>
        </div>
        <div class="rounded-xl bg-glass/20 border border-white/5 overflow-hidden">
          <div class="grid grid-cols-7 border-b border-white/5">
            <div v-for="day in weekDays" :key="day.dateStr" class="p-3 text-center border-r border-white/5 last:border-r-0" :class="day.isToday ? 'bg-wealth/5' : ''">
              <p class="text-xs text-text-muted mb-1">{{ day.weekday }}</p>
              <p class="text-lg font-bold" :class="day.isToday ? 'text-wealth' : 'text-text'">{{ day.dayNum }}</p>
            </div>
          </div>
          <div class="grid grid-cols-7 min-h-[400px]">
            <div
              v-for="day in weekDays"
              :key="'cell-' + day.dateStr"
              class="border-r border-white/5 last:border-r-0 p-2 space-y-1.5 overflow-y-auto"
              :class="day.isToday ? 'bg-wealth/[0.02]' : ''"
            >
              <div
                v-for="apt in getAppointmentsForDate(day.dateStr)"
                :key="apt.id"
                class="p-2 rounded-lg text-xs cursor-pointer transition-all hover:scale-[1.02]"
                :class="getAppointmentCardClass(apt.status)"
                @click="openDetailDialog(apt)"
              >
                <p class="font-bold truncate">{{ apt.title || t('appointments.consultationAppointment') }}</p>
                <p class="opacity-70">{{ formatTime(apt.startTime) }}</p>
              </div>
              <button
                @click="openCreateDialogForDate(day.dateStr)"
                class="w-full p-2 rounded-lg border border-dashed border-white/10 text-text-muted/40 hover:border-wealth/30 hover:text-wealth/60 transition-all text-xs flex items-center justify-center gap-1"
              >
                <component :is="Plus" class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeView === 'month'">
        <div class="flex items-center justify-between mb-4">
          <button @click="changeMonth(-1)" class="p-2 rounded-lg bg-glass/20 border border-white/5 hover:border-wealth/30 text-text-muted hover:text-text transition-all">
            <component :is="ChevronLeft" class="w-5 h-5" />
          </button>
          <h2 class="font-serif text-lg text-text">{{ monthLabel }}</h2>
          <button @click="changeMonth(1)" class="p-2 rounded-lg bg-glass/20 border border-white/5 hover:border-wealth/30 text-text-muted hover:text-text transition-all">
            <component :is="ChevronRight" class="w-5 h-5" />
          </button>
        </div>
        <div class="rounded-xl bg-glass/20 border border-white/5 overflow-hidden">
          <div class="grid grid-cols-7 border-b border-white/5">
            <div v-for="w in weekdayHeaders" :key="w" class="p-3 text-center text-xs text-text-muted font-bold uppercase tracking-wider">{{ w }}</div>
          </div>
          <div class="grid grid-cols-7">
            <div
              v-for="(cell, idx) in monthCells"
              :key="idx"
              class="min-h-[100px] border-r border-b border-white/5 last:border-r-0 p-2 transition-all"
              :class="cell.isCurrentMonth ? (cell.isToday ? 'bg-wealth/[0.03]' : '') : 'bg-black/20'"
            >
              <div class="flex items-center justify-between mb-1">
                <span
                  class="text-sm w-7 h-7 flex items-center justify-center rounded-full"
                  :class="cell.isToday ? 'bg-wealth text-obsidian font-bold' : (cell.isCurrentMonth ? 'text-text' : 'text-text-muted/30')"
                >
                  {{ cell.dayNum }}
                </span>
              </div>
              <div class="space-y-1">
                <div
                  v-for="apt in cell.appointments.slice(0, 2)"
                  :key="apt.id"
                  class="px-2 py-0.5 rounded text-[10px] truncate cursor-pointer transition-all"
                  :class="getAppointmentDotClass(apt.status)"
                  @click="openDetailDialog(apt)"
                >
                  {{ apt.title || t('appointments.consultation') }}
                </div>
                <p v-if="cell.appointments.length > 2" class="text-[10px] text-text-muted/50 pl-2">
                  +{{ cell.appointments.length - 2 }} {{ t('appointments.more') }}
                </p>
              </div>
              <button
                v-if="cell.isCurrentMonth"
                @click="openCreateDialogForDate(cell.dateStr)"
                class="mt-1 w-full py-0.5 rounded text-[10px] text-text-muted/30 hover:text-wealth/60 transition-all"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <el-dialog v-model="showDetailDialog" :title="t('appointments.appointmentDetail')" width="420px" custom-class="bg-obsidian border border-white/10">
      <div v-if="selectedAppointment" class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-serif text-lg text-text">{{ selectedAppointment.title || t('appointments.consultationAppointment') }}</h3>
          <span class="px-2 py-1 rounded text-xs font-bold" :class="getStatusClass(selectedAppointment.status)">
            {{ getStatusLabel(selectedAppointment.status) }}
          </span>
        </div>
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm text-text-muted">
            <component :is="Calendar" class="w-4 h-4" />
            <span>{{ formatDate(selectedAppointment.startTime) }}</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-text-muted">
            <component :is="Clock" class="w-4 h-4" />
            <span>{{ formatTime(selectedAppointment.startTime) }} - {{ formatTime(selectedAppointment.endTime) }}</span>
          </div>
          <div v-if="selectedAppointment.user" class="flex items-center gap-2 text-sm text-text-muted">
            <component :is="UserIcon" class="w-4 h-4" />
            <span>{{ selectedAppointment.user.name || t('appointments.dedicatedAdvisor') }}</span>
          </div>
          <p v-if="selectedAppointment.description" class="text-sm text-text-muted pt-2 border-t border-white/5">{{ selectedAppointment.description }}</p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button @click="showDetailDialog = false" class="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors">{{ t('common.cancel') }}</button>
          <button
            v-if="selectedAppointment && selectedAppointment.status !== 'CANCELLED' && selectedAppointment.status !== 'COMPLETED'"
            @click="handleCancelFromDetail"
            class="px-4 py-2 text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded transition-colors"
          >
            {{ t('appointments.cancelAppointment') }}
          </button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="showCreateDialog" :title="t('appointments.createAppointment')" width="480px" custom-class="bg-obsidian border border-white/10">
      <div class="space-y-4">
        <div class="space-y-2">
          <label class="block text-xs font-bold uppercase tracking-wider text-text-muted">{{ t('appointments.meetingTopic') }}</label>
          <input v-model="createForm.title" type="text" class="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-text text-sm focus:outline-none focus:border-wealth/50 transition-colors" :placeholder="t('appointments.topicPlaceholder')">
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="block text-xs font-bold uppercase tracking-wider text-text-muted">{{ t('appointments.startTime') }}</label>
            <input v-model="createForm.startTime" type="datetime-local" class="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-text text-sm focus:outline-none focus:border-wealth/50 transition-colors">
          </div>
          <div class="space-y-2">
            <label class="block text-xs font-bold uppercase tracking-wider text-text-muted">{{ t('appointments.endTime') }}</label>
            <input v-model="createForm.endTime" type="datetime-local" class="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-text text-sm focus:outline-none focus:border-wealth/50 transition-colors">
          </div>
        </div>
        <div class="space-y-2">
          <label class="block text-xs font-bold uppercase tracking-wider text-text-muted">{{ t('appointments.remarks') }}</label>
          <textarea v-model="createForm.description" rows="3" class="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-text text-sm focus:outline-none focus:border-wealth/50 transition-colors resize-none" :placeholder="t('appointments.remarksPlaceholder')"></textarea>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button @click="showCreateDialog = false" class="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors">{{ t('common.cancel') }}</button>
          <button @click="submitCreate" :disabled="isCreating || !createForm.title.trim() || !createForm.startTime" class="px-6 py-2 bg-wealth text-obsidian text-sm font-bold rounded hover:bg-[#B49248] transition-colors disabled:opacity-50 flex items-center gap-2">
            <component v-if="isCreating" :is="Loader2" class="w-4 h-4 animate-spin" />
            {{ t('appointments.confirmAppointment') }}
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { portalApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, Clock, User as UserIcon, Plus, XCircle, ChevronLeft, ChevronRight, List, CalendarDays, CalendarRange, Loader2 } from 'lucide-vue-next'

interface Appointment {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  status: string
  user?: { name: string }
}

type ViewMode = 'list' | 'week' | 'month'

const { t } = useI18n()

const viewOptions = computed<{ value: ViewMode; label: string; icon: any }[]>(() => [
  { value: 'list', label: t('appointments.viewList'), icon: List },
  { value: 'week', label: t('appointments.viewWeek'), icon: CalendarRange },
  { value: 'month', label: t('appointments.viewMonth'), icon: CalendarDays },
])

const loading = ref(true)
const appointments = ref<Appointment[]>([])
const activeView = ref<ViewMode>('list')
const selectedAppointment = ref<Appointment | null>(null)
const showDetailDialog = ref(false)
const showCreateDialog = ref(false)
const isCreating = ref(false)

const weekStart = ref(getMonday(new Date()))
const monthCursor = ref(new Date())

const createForm = ref({
  title: '',
  startTime: '',
  endTime: '',
  description: '',
})

onMounted(() => {
  fetchAppointments()
})

async function fetchAppointments(): Promise<void> {
  loading.value = true
  try {
    const res = await portalApi.getAppointments({ limit: 100 })
    appointments.value = res.appointments || []
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : t('appointments.fetchError')
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}

async function handleCancel(id: string): Promise<void> {
  try {
    await ElMessageBox.confirm(t('appointments.cancelConfirmMsg'), t('appointments.cancelAppointment'), {
      confirmButtonText: t('appointments.confirmCancel'),
      cancelButtonText: t('appointments.thinkAgain'),
      type: 'warning',
      customClass: 'bg-obsidian border border-white/10',
    })
    await portalApi.cancelAppointment(id)
    ElMessage.success(t('appointments.cancelSuccess'))
    fetchAppointments()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      const msg = error instanceof Error ? error.message : t('appointments.cancelError')
      ElMessage.error(msg)
    }
  }
}

function handleCancelFromDetail(): void {
  if (!selectedAppointment.value) return
  showDetailDialog.value = false
  handleCancel(selectedAppointment.value.id)
}

function openDetailDialog(apt: Appointment): void {
  selectedAppointment.value = apt
  showDetailDialog.value = true
}

function openCreateDialog(): void {
  const now = new Date()
  const start = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  start.setMinutes(0, 0, 0)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  createForm.value = {
    title: '',
    startTime: toLocalDatetimeStr(start),
    endTime: toLocalDatetimeStr(end),
    description: '',
  }
  showCreateDialog.value = true
}

function openCreateDialogForDate(dateStr: string): void {
  const [y, m, d] = dateStr.split('-').map(Number)
  const start = new Date(y, m - 1, d, 10, 0, 0)
  const end = new Date(y, m - 1, d, 11, 0, 0)
  createForm.value = {
    title: '',
    startTime: toLocalDatetimeStr(start),
    endTime: toLocalDatetimeStr(end),
    description: '',
  }
  showCreateDialog.value = true
}

async function submitCreate(): Promise<void> {
  if (!createForm.value.title.trim() || !createForm.value.startTime) return
  isCreating.value = true
  try {
    const startTime = new Date(createForm.value.startTime).toISOString()
    const endTime = createForm.value.endTime
      ? new Date(createForm.value.endTime).toISOString()
      : new Date(new Date(createForm.value.startTime).getTime() + 60 * 60 * 1000).toISOString()
    await portalApi.bookAppointment({
      title: createForm.value.title,
      description: createForm.value.description || undefined,
      startTime,
      endTime,
      userId: '',
    })
    ElMessage.success(t('appointments.createSuccess'))
    showCreateDialog.value = false
    fetchAppointments()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : t('appointments.createError')
    ElMessage.error(msg)
  } finally {
    isCreating.value = false
  }
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function changeWeek(dir: number): void {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + dir * 7)
  weekStart.value = d
}

function changeMonth(dir: number): void {
  const d = new Date(monthCursor.value)
  d.setMonth(d.getMonth() + dir)
  monthCursor.value = d
}

const weekDays = computed(() => {
  const days = []
  const weekdays = [t('appointments.weekdayMon'), t('appointments.weekdayTue'), t('appointments.weekdayWed'), t('appointments.weekdayThu'), t('appointments.weekdayFri'), t('appointments.weekdaySat'), t('appointments.weekdaySun')]
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    const today = new Date()
    days.push({
      dateStr: formatDateStr(d),
      weekday: weekdays[i],
      dayNum: d.getDate(),
      isToday: formatDateStr(d) === formatDateStr(today),
    })
  }
  return days
})

const weekRangeLabel = computed(() => {
  const start = weekDays.value[0]
  const end = weekDays.value[6]
  if (!start || !end) return ''
  return `${start.dateStr} ~ ${end.dateStr}`
})

const monthLabel = computed(() => {
  const y = monthCursor.value.getFullYear()
  const m = monthCursor.value.getMonth() + 1
  return t('appointments.monthLabel', { year: y, month: m })
})

const weekdayHeaders = computed(() => [
  t('appointments.weekdayShortMon'),
  t('appointments.weekdayShortTue'),
  t('appointments.weekdayShortWed'),
  t('appointments.weekdayShortThu'),
  t('appointments.weekdayShortFri'),
  t('appointments.weekdayShortSat'),
  t('appointments.weekdayShortSun'),
])

const monthCells = computed(() => {
  const year = monthCursor.value.getFullYear()
  const month = monthCursor.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7
  const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean; appointments: Appointment[] }[] = []
  const today = formatDateStr(new Date())

  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    cells.push({
      dateStr: formatDateStr(d),
      dayNum: d.getDate(),
      isCurrentMonth: false,
      isToday: false,
      appointments: getAppointmentsForDate(formatDateStr(d)),
    })
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = formatDateStr(new Date(year, month, d))
    cells.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
      isToday: dateStr === today,
      appointments: getAppointmentsForDate(dateStr),
    })
  }

  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d)
    cells.push({
      dateStr: formatDateStr(date),
      dayNum: d,
      isCurrentMonth: false,
      isToday: false,
      appointments: getAppointmentsForDate(formatDateStr(date)),
    })
  }

  return cells
})

function getAppointmentsForDate(dateStr: string): Appointment[] {
  return appointments.value.filter(apt => {
    const aptDate = formatDateStr(new Date(apt.startTime))
    return aptDate === dateStr
  })
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toLocalDatetimeStr(d: Date): string {
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: t('appointments.statusPending'),
    CONFIRMED: t('appointments.statusConfirmed'),
    CANCELLED: t('appointments.statusCancelled'),
    COMPLETED: t('appointments.statusCompleted'),
  }
  return map[status] || status
}

function getStatusClass(status: string): string {
  if (status === 'CONFIRMED') return 'bg-green-500/20 text-green-400'
  if (status === 'PENDING') return 'bg-orange-500/20 text-orange-400'
  if (status === 'CANCELLED') return 'bg-white/10 text-text-muted'
  if (status === 'COMPLETED') return 'bg-blue-500/20 text-blue-400'
  return 'bg-white/10 text-text-muted'
}

function getAppointmentCardClass(status: string): string {
  if (status === 'CONFIRMED') return 'bg-green-500/10 border border-green-500/20 text-green-300'
  if (status === 'PENDING') return 'bg-orange-500/10 border border-orange-500/20 text-orange-300'
  if (status === 'CANCELLED') return 'bg-white/5 border border-white/10 text-text-muted line-through'
  if (status === 'COMPLETED') return 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
  return 'bg-white/5 border border-white/10 text-text-muted'
}

function getAppointmentDotClass(status: string): string {
  if (status === 'CONFIRMED') return 'bg-green-500/15 text-green-400'
  if (status === 'PENDING') return 'bg-orange-500/15 text-orange-400'
  if (status === 'CANCELLED') return 'bg-white/5 text-text-muted/50 line-through'
  if (status === 'COMPLETED') return 'bg-blue-500/15 text-blue-400'
  return 'bg-white/5 text-text-muted'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>
