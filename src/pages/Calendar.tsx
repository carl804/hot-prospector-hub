import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCalendarAppointments, AppointmentType, CalendarAppointment } from '@/hooks/useCalendarAppointments';
import { cn } from '@/lib/utils';

const APPOINTMENT_COLORS: Record<AppointmentType, { bg: string; text: string; border: string }> = {
  assessment: { bg: 'bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
  onboarding: { bg: 'bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
  kickoff: { bg: 'bg-green-500/20', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/30' },
};

const APPOINTMENT_ICONS: Record<AppointmentType, React.ReactNode> = {
  assessment: <Phone className="w-3 h-3" />,
  onboarding: <Video className="w-3 h-3" />,
  kickoff: <User className="w-3 h-3" />,
};

const APPOINTMENT_LABELS: Record<AppointmentType, string> = {
  assessment: 'Assessment Call',
  onboarding: 'Onboarding Call',
  kickoff: 'Kickoff Call',
};

export default function Calendar() {
  const { appointments, appointmentsByDate, isLoading, totalCount } = useCalendarAppointments();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [typeFilter, setTypeFilter] = useState<AppointmentType | 'all'>('all');

  // Filter appointments by type
  const filteredAppointments = useMemo(() => {
    if (typeFilter === 'all') return appointments;
    return appointments.filter((apt) => apt.appointmentType === typeFilter);
  }, [appointments, typeFilter]);

  // Build filtered appointments by date
  const filteredByDate = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    filteredAppointments.forEach((apt) => {
      const dateKey = apt.date.toISOString().split('T')[0];
      const existing = map.get(dateKey) || [];
      existing.push(apt);
      map.set(dateKey, existing);
    });
    return map;
  }, [filteredAppointments]);

  // Get days for current month view
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Get appointments for selected date
  const selectedDateAppointments = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = selectedDate.toISOString().split('T')[0];
    return filteredByDate.get(dateKey) || [];
  }, [selectedDate, filteredByDate]);

  // Stats
  const stats = useMemo(() => {
    const thisMonth = filteredAppointments.filter((apt) => isSameMonth(apt.date, currentMonth));
    const byType = {
      assessment: thisMonth.filter((a) => a.appointmentType === 'assessment').length,
      onboarding: thisMonth.filter((a) => a.appointmentType === 'onboarding').length,
      kickoff: thisMonth.filter((a) => a.appointmentType === 'kickoff').length,
    };
    return { total: thisMonth.length, byType };
  }, [filteredAppointments, currentMonth]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" />
            Appointment Calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount} total appointments scheduled
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as AppointmentType | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="assessment">Assessment Calls</SelectItem>
              <SelectItem value="onboarding">Onboarding Calls</SelectItem>
              <SelectItem value="kickoff">Kickoff Calls</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="card-frosted">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">This Month</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        {(['assessment', 'onboarding', 'kickoff'] as AppointmentType[]).map((type) => (
          <Card key={type} className={cn('card-frosted border', APPOINTMENT_COLORS[type].border)}>
            <CardContent className="p-4">
              <p className={cn('text-xs font-medium flex items-center gap-1', APPOINTMENT_COLORS[type].text)}>
                {APPOINTMENT_ICONS[type]}
                {APPOINTMENT_LABELS[type]}
              </p>
              <p className="text-2xl font-bold text-foreground">{stats.byType[type]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2 card-frosted">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month start */}
              {Array.from({ length: monthDays[0].getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24" />
              ))}

              {monthDays.map((day) => {
                const dateKey = day.toISOString().split('T')[0];
                const dayAppointments = filteredByDate.get(dateKey) || [];
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasAppointments = dayAppointments.length > 0;

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'h-24 p-1 rounded-lg border transition-all text-left',
                      'hover:border-primary/50 hover:bg-accent/50',
                      isToday(day) && 'border-primary/50 bg-primary/5',
                      isSelected && 'border-primary bg-primary/10 ring-2 ring-primary/20',
                      !hasAppointments && 'border-transparent'
                    )}
                  >
                    <div className={cn(
                      'text-xs font-medium mb-1',
                      isToday(day) ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      {format(day, 'd')}
                    </div>

                    {/* Appointment indicators */}
                    <div className="space-y-0.5 overflow-hidden">
                      {dayAppointments.slice(0, 3).map((apt) => (
                        <div
                          key={apt.id}
                          className={cn(
                            'text-[10px] px-1 py-0.5 rounded truncate',
                            APPOINTMENT_COLORS[apt.appointmentType].bg,
                            APPOINTMENT_COLORS[apt.appointmentType].text
                          )}
                        >
                          {apt.clientName.split(' ')[0]}
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-[10px] text-muted-foreground px-1">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card className="card-frosted">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a day'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground">
                Click on a day to see appointment details
              </p>
            ) : selectedDateAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No appointments scheduled for this day
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      APPOINTMENT_COLORS[apt.appointmentType].bg,
                      APPOINTMENT_COLORS[apt.appointmentType].border
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {apt.clientName}
                        </p>
                        <p className={cn('text-xs flex items-center gap-1 mt-0.5', APPOINTMENT_COLORS[apt.appointmentType].text)}>
                          {APPOINTMENT_ICONS[apt.appointmentType]}
                          {APPOINTMENT_LABELS[apt.appointmentType]}
                        </p>
                      </div>
                      <Badge variant={apt.booked ? 'default' : 'outline'} className="text-[10px]">
                        {apt.booked ? 'Booked' : 'Pending'}
                      </Badge>
                    </div>
                    {apt.contactEmail && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {apt.contactEmail}
                      </p>
                    )}
                    {apt.dateString && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(apt.date, 'h:mm a')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <span className="font-medium">Legend:</span>
        {(['assessment', 'onboarding', 'kickoff'] as AppointmentType[]).map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rounded', APPOINTMENT_COLORS[type].bg)} />
            <span>{APPOINTMENT_LABELS[type]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
