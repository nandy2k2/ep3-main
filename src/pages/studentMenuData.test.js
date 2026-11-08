import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import { studentMenuFlatItems, studentDefaultMenuGroups } from './studentMenuData';

test('management catalog includes all named links in the student menu', () => {
  const ast = parse(fs.readFileSync(path.join(__dirname, 'menustud1.js'), 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  const paths = new Set(studentMenuFlatItems.map(item => item.path));
  const missing = [];
  const walk = (node, visit) => {
    if (!node || typeof node !== 'object') return;
    visit(node);
    Object.entries(node).forEach(([key,value]) => {
      if (key === 'loc') return;
      if (Array.isArray(value)) value.forEach(child => walk(child, visit));
      else if (value && typeof value === 'object') walk(value, visit);
    });
  };
  walk(ast, node => {
    if (node.openingElement?.name?.name !== 'ListItem') return;
    const to = node.openingElement.attributes.find(attr => attr.name?.name === 'to')?.value;
    let named = false;
    walk(node, child => {
      if (child.openingElement?.name?.name === 'ListItemText') named = true;
    });
    if (named && to?.type === 'StringLiteral' && !paths.has(to.value)) missing.push(to.value);
  });
  expect(missing).toEqual([]);
});
test('management catalog IDs and group names are unique', () => {
  expect(new Set(studentMenuFlatItems.map(item => item.id)).size).toBe(studentMenuFlatItems.length);
  expect(new Set(studentDefaultMenuGroups.map(group => group.group)).size).toBe(studentDefaultMenuGroups.length);
});
