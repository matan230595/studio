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

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    (props.selected as Date) || props.month || new Date()
  )

  React.useEffect(() => {
    if (props.month) {
      setCurrentMonth(props.month)
    }
  }, [props.month])

  return (
    <DayPicker
      locale={he}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      month={currentMonth}
      onMonthChange={setCurrentMonth}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
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
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
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
          const selectedYear = currentMonth.getFullYear()

          if (dropdownProps.name === "months") {
            const months = Array.from({ length: 12 }, (_, i) => ({
              value: i,
              label: format(new Date(selectedYear, i, 1), "LLLL", {
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
            const start = fromYear || currentYear - 50
            const end = toYear || currentYear + 10
            for (let i = start; i <= end; i++) {
              years.push(i)
            }
            return (
              <Select
                value={String(selectedYear)}
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
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
