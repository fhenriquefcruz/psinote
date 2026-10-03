import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  SAFE_SEARCH_COMMANDS,
  commandMatches,
  metadataMatches,
  normalizeSearchText
} from '../../src/domain/search.js';

describe('search normalization', () => {
  test('normalizes accents, case and whitespace', () => {
    assert.equal(
      normalizeSearchText('  João   da  SILVA  '),
      'joao da silva'
    );
  });

  test('metadata matching is accent-insensitive', () => {
    assert.equal(
      metadataMatches('joao', ['João da Silva']),
      true
    );
    assert.equal(
      metadataMatches('maria', ['João da Silva']),
      false
    );
  });
});

describe('command palette matching', () => {
  test('empty query exposes all safe commands', () => {
    assert.ok(SAFE_SEARCH_COMMANDS.length >= 5);
    assert.ok(
      SAFE_SEARCH_COMMANDS.every((command) =>
        commandMatches('', command)
      )
    );
  });

  test('commands match labels, descriptions and keywords', () => {
    const documentCommand = SAFE_SEARCH_COMMANDS.find(
      (command) => command.id === 'new-document'
    );

    assert.equal(commandMatches('declaracao', documentCommand), true);
    assert.equal(commandMatches('novo documento', documentCommand), true);
    assert.equal(commandMatches('agenda', documentCommand), false);
  });
});
