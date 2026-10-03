import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcRoot = path.join(root, 'src');

const readAllSourceFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return readAllSourceFiles(fullPath);
    if (!/\.(js|jsx|ts|tsx)$/.test(entry.name)) return [];
    return [{ path: fullPath, content: fs.readFileSync(fullPath, 'utf8') }];
  });
};

const sourceFiles = readAllSourceFiles(srcRoot);
const violations = [];

const checks = [
  {
    label: 'hard-coded privileged account',
    pattern: /fhenriquefcruz@gmail\.com/i
  },
  {
    label: 'public Supabase document URL',
    pattern: /\.getPublicUrl\s*\(/
  },
  {
    label: 'destructive Firestore delete in browser bundle',
    pattern: /\bdeleteDoc\s*\(/
  },
  {
    label: 'destructive Firebase Storage delete in browser bundle',
    pattern: /\bdeleteObject\s*\(/
  },
  {
    label: 'destructive Supabase Storage remove in browser bundle',
    pattern: /\.storage[\s\S]{0,120}\.remove\s*\(/
  }
];

for (const file of sourceFiles) {
  for (const check of checks) {
    if (check.pattern.test(file.content)) {
      violations.push(`${check.label}: ${path.relative(root, file.path)}`);
    }
  }
}

const searchBoundaryFiles = sourceFiles.filter((file) => {
  const relativePath = path.relative(root, file.path).replace(/\\/g, '/');
  return [
    'src/services/searchService.js',
    'src/services/searchIndexService.js'
  ].includes(relativePath);
});

const forbiddenClinicalSearchFields = /\b(mainTheme|clinicalEvolution|evolution|observations|interventions|referrals|agreements|nextSteps|anamnesis|tags)\b/;

for (const file of searchBoundaryFiles) {
  if (forbiddenClinicalSearchFields.test(file.content)) {
    violations.push(
      'clinical narrative field referenced by search boundary: '
      + path.relative(root, file.path)
    );
  }
}

for (const requiredFile of ['firestore.rules', 'storage.rules', 'firebase.json']) {
  if (!fs.existsSync(path.join(root, requiredFile))) {
    violations.push(`missing security configuration: ${requiredFile}`);
  }
}

if (violations.length > 0) {
  console.error('Security baseline failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Security baseline checks passed.');
