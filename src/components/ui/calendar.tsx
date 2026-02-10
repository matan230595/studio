"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DropdownProps } from "react-day-picker"
import { he } from "date-fns/locale"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { buttonVariants, Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  onDateSelect?: (date: Date | undefined) => void
  onCancel?: () => void
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  onDateSelect,
  onCancel,
  ...props
}: CalendarProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    props.selected as Date
  )
  const [currentMonth, setCurrentMonth] = React.useState(
    (props.selected as Date) || new Date()
  )

  React.useEffect(() => {
    setSelectedDate(props.selected as Date)
    if (props.selected) {
      setCurrentMonth(props.selected as Date)
    }
  }, [props.selected])

  const handleOk = () => {
    if (onDateSelect) {
      onDateSelect(selectedDate)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <div className={cn("rounded-lg border bg-card shadow-lg", className)}>
      <div className="bg-primary p-4 text-primary-foreground text-center rounded-t-lg">
        <p className="text-lg font-medium">
          {selectedDate
            ? format(selectedDate, "eee, d MMM", { locale: he })
            : "בחר תאריך"}
        </p>
      </div>
      <DayPicker
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        selected={selectedDate}
        onSelect={setSelectedDate}
        locale={he}
        showOutsideDays={showOutsideDays}
        className="p-3"
        classNames={{
          months:
            "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          caption_dropdowns: "flex gap-2 items-center",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full",
          day_today: "bg-accent text-accent-foreground rounded-full",
          day_outside: "text-muted-foreground opacity-50",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
          IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
          Dropdown: ({ ...dropdownProps }: DropdownProps) => {
            const { fromYear, toYear } = dropdownProps
            const currentYear = new Date().getFullYear()

            if (dropdownProps.name === "months") {
              const months = Array.from({ length: 12 }, (_, i) => ({
                value: i,
                label: format(new Date(currentYear, i, 1), "MMMM", {
                  locale: he,
                }),
              }))
              return (
                <Select
                  value={String(currentMonth.getMonth())}
                  onValueChange={value => {
                    const newMonth = new Date(currentMonth)
                    newMonth.setMonth(Number(value))
                    setCurrentMonth(newMonth)
                  }}
                  dir="rtl"
                >
                  <SelectTrigger className="w-[120px] h-8 text-sm focus:ring-0 border-0 bg-transparent font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month.value} value={String(month.value)}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            }
            if (dropdownProps.name === "years") {
              const years: number[] = []
              const start = fromYear || currentYear - 100
              const end = toYear || currentYear + 10
              for (let i = start; i <= end; i++) {
                years.push(i)
              }
              return (
                <Select
                  value={String(currentMonth.getFullYear())}
                  onValueChange={value => {
                    const newMonth = new Date(currentMonth)
                    newMonth.setFullYear(Number(value))
                    setCurrentMonth(newMonth)
                  }}
                   dir="rtl"
                >
                  <SelectTrigger className="w-[80px] h-8 text-sm focus:ring-0 border-0 bg-transparent font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            }
            return null
          },
        }}
        {...props}
        captionLayout="dropdown-buttons"
      />
      <div className="flex justify-end gap-2 p-3 border-t">
        <Button variant="ghost" onClick={handleCancel}>
          ביטול
        </Button>
        <Button onClick={handleOk}>אישור</Button>
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
