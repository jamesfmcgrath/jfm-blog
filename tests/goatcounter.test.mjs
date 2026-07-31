import { test } from 'node:test';
import assert from 'node:assert/strict';
import { goatcounterCountUrl } from '../src/lib/goatcounter.ts';

test('returns null when code is unset or blank', () => {
	assert.equal(goatcounterCountUrl(undefined), null);
	assert.equal(goatcounterCountUrl(''), null);
	assert.equal(goatcounterCountUrl('   '), null);
});

test('returns count URL for a valid site code', () => {
	assert.equal(
		goatcounterCountUrl('jamesfmcgrath'),
		'https://jamesfmcgrath.goatcounter.com/count',
	);
});

test('trims whitespace around the code', () => {
	assert.equal(
		goatcounterCountUrl('  jamesfmcgrath  '),
		'https://jamesfmcgrath.goatcounter.com/count',
	);
});
