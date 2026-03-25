export type DateLike = string | Date | number

interface DateFormatOptions extends Intl.DateTimeFormatOptions {
  locale?: string
}

interface CurrencyFormatOptions {
  locale?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

function toDate(value: DateLike): Date {
  if (value instanceof Date) {
    return value
  }

  if (typeof value === "number") {
    return new Date(value)
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00Z`)
  }

  return new Date(value)
}

export function formatDate(value: DateLike, options: DateFormatOptions = {}) {
  const {
    locale = "en-GB",
    ...formatOptions
  } = options

  return toDate(value).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...formatOptions,
  })
}

export function formatDateRange(
  start: DateLike,
  end: DateLike,
  options: DateFormatOptions = {},
) {
  const startLabel = formatDate(start, options)
  const endLabel = formatDate(end, options)

  if (startLabel === endLabel) {
    return startLabel
  }

  return `${startLabel} - ${endLabel}`
}

export function formatCurrency(
  cents: number,
  currency = "EUR",
  options: CurrencyFormatOptions = {},
) {
  const {
    locale = "en-EU",
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(cents / 100)
}

export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions & { locale?: string } = {},
) {
  const {
    locale = "en-GB",
    ...formatOptions
  } = options

  return new Intl.NumberFormat(locale, formatOptions).format(value)
}

export function formatPercent(
  value: number,
  options: Intl.NumberFormatOptions & { locale?: string } = {},
) {
  const {
    locale = "en-GB",
    maximumFractionDigits = 0,
    minimumFractionDigits = maximumFractionDigits,
    ...formatOptions
  } = options

  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits,
    minimumFractionDigits,
    ...formatOptions,
  }).format(value)
}
