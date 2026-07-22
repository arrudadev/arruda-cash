import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import RecurringRule from '#models/recurring_rule'

function ruleStartingOn(iso: string, installmentsTotal: number | null = null) {
  const rule = new RecurringRule()
  rule.startMonth = DateTime.fromISO(iso).startOf('month')
  rule.installmentsTotal = installmentsTotal
  return rule
}

test.group('RecurringRule#installmentProgress', () => {
  test('an indefinite rule applies to any month at or after startMonth', ({ assert }) => {
    const rule = ruleStartingOn('2026-07-01')

    assert.isTrue(rule.installmentProgress(DateTime.fromISO('2026-07-01')).applies)
    assert.isTrue(rule.installmentProgress(DateTime.fromISO('2027-01-01')).applies)
    assert.isNull(rule.installmentProgress(DateTime.fromISO('2027-01-01')).index)
    assert.isNull(rule.installmentProgress(DateTime.fromISO('2027-01-01')).remaining)
  })

  test('an indefinite rule does not apply before startMonth', ({ assert }) => {
    const rule = ruleStartingOn('2026-07-01')

    assert.isFalse(rule.installmentProgress(DateTime.fromISO('2026-06-01')).applies)
  })

  test('a parcelled rule reports the 1-based installment index and remaining count', ({
    assert,
  }) => {
    const rule = ruleStartingOn('2026-07-01', 12)

    const first = rule.installmentProgress(DateTime.fromISO('2026-07-01'))
    assert.isTrue(first.applies)
    assert.equal(first.index, 1)
    assert.equal(first.remaining, 12)

    // The 4th month in is installment #4, with 9 (itself included) still to go.
    const fourth = rule.installmentProgress(DateTime.fromISO('2026-10-15'))
    assert.isTrue(fourth.applies)
    assert.equal(fourth.index, 4)
    assert.equal(fourth.remaining, 9)

    const last = rule.installmentProgress(DateTime.fromISO('2027-06-01'))
    assert.isTrue(last.applies)
    assert.equal(last.index, 12)
    assert.equal(last.remaining, 1)
  })

  test('a parcelled rule stops applying once its installments are exhausted', ({ assert }) => {
    const rule = ruleStartingOn('2026-07-01', 12)

    const afterLast = rule.installmentProgress(DateTime.fromISO('2027-07-01'))
    assert.isFalse(afterLast.applies)
    assert.equal(afterLast.remaining, 0)
  })

  test('defaults to the current month when no month is given', ({ assert }) => {
    const rule = ruleStartingOn(DateTime.now().startOf('month').toISODate() as string)

    assert.isTrue(rule.installmentProgress().applies)
  })
})

function ruleAnchoredOn(dayOfMonth: number) {
  const rule = new RecurringRule()
  rule.dayOfMonth = dayOfMonth
  return rule
}

test.group('RecurringRule#anchorDateFor', () => {
  test('lands on dayOfMonth for a month long enough to have it', ({ assert }) => {
    const rule = ruleAnchoredOn(15)

    assert.equal(rule.anchorDateFor(DateTime.fromISO('2026-07-01')).toISODate(), '2026-07-15')
  })

  test('clamps to the last day of a shorter month', ({ assert }) => {
    const rule = ruleAnchoredOn(31)

    assert.equal(rule.anchorDateFor(DateTime.fromISO('2026-04-01')).toISODate(), '2026-04-30')
    assert.equal(rule.anchorDateFor(DateTime.fromISO('2026-02-01')).toISODate(), '2026-02-28')
  })
})
