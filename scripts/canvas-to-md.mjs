/**
 * canvas-to-md.mjs
 *
 * Converts Obsidian canvas (.canvas) files to Starlight-compatible Markdown.
 *
 * An Obsidian canvas is a JSON file containing:
 *   - nodes: text cards, file references, external links, and group containers
 *   - edges: directional connections between nodes with optional labels
 *
 * This script renders each canvas as a structured docs page:
 *   - Groups become ## sections (sorted left-to-right by x position)
 *   - Text nodes inside each group become bullet items (sorted top-to-bottom)
 *   - Edges become a "Feature Dependencies" table at the bottom
 *   - Orphan text nodes (outside any group) are placed in a Notes section
 *
 * Usage (called by the sync_to_web.yml workflow):
 *   node scripts/canvas-to-md.mjs <sourceDir> <outputDir>
 *
 * Example:
 *   node scripts/canvas-to-md.mjs ./obsidian/Gamedev/Synadrive ./dotcom/src/content/docs/synadrive
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { join, basename } from 'path';

const [,, sourceDir, outDir] = process.argv;

if (!sourceDir || !outDir) {
  console.error('Usage: node canvas-to-md.mjs <sourceDir> <outputDir>');
  process.exit(1);
}

/**
 * Returns true if a node's bounding box falls entirely within a group's bounds.
 * Nodes exactly on the group boundary are considered inside.
 */
function isInsideGroup(node, group) {
  return (
    node.x >= group.x &&
    node.y >= group.y &&
    node.x + node.width <= group.x + group.width &&
    node.y + node.height <= group.y + group.height
  );
}

/**
 * Parses the text content of an Obsidian text node.
 * Obsidian uses **Bold text** for the feature name on the first line,
 * with a short description or subtitle on subsequent lines.
 * Returns { name, desc }.
 */
function parseNodeText(rawText) {
  const lines = rawText.trim().split('\n');
  const name = lines[0].replace(/\*\*/g, '').trim();
  const desc = lines
    .slice(1)
    .map((l) => l.trim())
    .filter(Boolean)
    .join(' ');
  return { name, desc };
}

/**
 * Returns a human-readable label for any node type,
 * used when building the edges dependency table.
 */
function nodeLabel(node) {
  if (!node) return '(unknown)';
  switch (node.type) {
    case 'text':
      return parseNodeText(node.text).name;
    case 'group':
      return node.label ?? '(group)';
    case 'file':
      return node.file ?? '(file)';
    case 'link':
      return node.url ?? '(link)';
    default:
      return node.id;
  }
}

/**
 * Converts a parsed canvas object to a Starlight Markdown string.
 * @param {object} canvas  Parsed canvas JSON ({ nodes, edges })
 * @param {string} title   Display title for the page (derived from filename)
 * @returns {string}       Full Markdown/MDX content for the docs page
 */
function canvasToMarkdown(canvas, title) {
  const { nodes = [], edges = [] } = canvas;

  const groups = nodes
    .filter((n) => n.type === 'group')
    .sort((a, b) => a.x - b.x); // left-to-right = tier order

  const textNodes = nodes.filter((n) => n.type === 'text');
  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));

  let md = '';

  // --- Frontmatter ---
  md += '---\n';
  md += `title: "${title}"\n`;
  md += `description: "Auto-generated from Obsidian canvas — visual overview of ${title}."\n`;
  md += '---\n\n';
  md += ':::note\n';
  md += 'This page is auto-generated from an Obsidian canvas file. ';
  md += 'Edit the source `.canvas` in Obsidian to update this page.\n';
  md += ':::\n\n';

  // --- Group sections ---
  for (const group of groups) {
    const label = group.label ?? 'Untitled';
    md += `## ${label}\n\n`;

    const inside = textNodes
      .filter((n) => isInsideGroup(n, group))
      .sort((a, b) => a.y - b.y || a.x - b.x); // top-to-bottom, then left-to-right

    for (const node of inside) {
      const { name, desc } = parseNodeText(node.text);
      md += desc ? `- **${name}** — ${desc}\n` : `- **${name}**\n`;
    }

    md += '\n';
  }

  // --- Orphan text nodes (not inside any group) ---
  const orphans = textNodes.filter(
    (n) => !groups.some((g) => isInsideGroup(n, g))
  );
  if (orphans.length > 0) {
    md += '## Notes\n\n';
    for (const node of orphans.sort((a, b) => a.y - b.y)) {
      md += `${node.text.trim()}\n\n`;
    }
  }

  // --- Edges / dependency table ---
  if (edges.length > 0) {
    md += '## Feature Dependencies\n\n';
    md += '| From | Relationship | To |\n';
    md += '|---|---|---|\n';
    for (const edge of edges) {
      const from = nodeLabel(nodeById[edge.fromNode]);
      const to = nodeLabel(nodeById[edge.toNode]);
      const rel = edge.label ?? '→';
      md += `| ${from} | ${rel} | ${to} |\n`;
    }
    md += '\n';
  }

  return md;
}

// --- Main ---
const canvasFiles = readdirSync(sourceDir).filter((f) => f.endsWith('.canvas'));

if (canvasFiles.length === 0) {
  console.log('canvas-to-md: no .canvas files found in', sourceDir);
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });

let converted = 0;
for (const file of canvasFiles) {
  const canvasPath = join(sourceDir, file);
  let canvas;
  try {
    canvas = JSON.parse(readFileSync(canvasPath, 'utf8'));
  } catch (err) {
    console.warn(`canvas-to-md: skipping ${file} — JSON parse error: ${err.message}`);
    continue;
  }

  const title = basename(file, '.canvas');
  const md = canvasToMarkdown(canvas, title);
  const outFile = join(outDir, `${title}.md`);

  writeFileSync(outFile, md, 'utf8');
  console.log(`canvas-to-md: ${file} → ${outFile}`);
  converted++;
}

console.log(`canvas-to-md: converted ${converted} canvas file(s).`);
