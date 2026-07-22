import { test } from '@japa/runner'
import { toCents } from '#services/money'

test.group('toCents', () => {
  test('converts reais to an integer number of cents', ({ assert }) => {
    assert.equal(toCents(42.5), 4250)
    assert.equal(toCents(10), 1000)
  })

  test('rounds to the nearest cent to avoid floating-point drift', ({ assert }) => {
    assert.equal(toCents(19.999), 2000)
    assert.equal(toCents(0.1 + 0.2), 30)
  })
})
