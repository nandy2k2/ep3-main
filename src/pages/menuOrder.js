import React from "react";
const normalize = value => String(value || "").trim().toLowerCase();
export function orderMenuTree(tree, rules = [], role = "") {
  const ranks = new Map();
  for (const rule of [...rules.filter(row => normalize(row.role) === "all"), ...rules.filter(row => normalize(row.role) === normalize(role))]) {
    if (normalize(rule.access) !== "allow" || rule.order === null || rule.order === undefined || String(rule.order).trim() === "" || !Number.isFinite(Number(rule.order))) continue;
    ranks.set(normalize(rule.path), Number(rule.order));
  }
  if (!ranks.size) return tree;
  const hasLinks = node => React.isValidElement(node) && (Boolean(node.props.to) || React.Children.toArray(node.props.children).some(hasLinks));
  const isMenuEntry = node => {
    if (!React.isValidElement(node)) return false;
    if (node.props.to) return true;
    const children = React.Children.toArray(node.props.children);
    return children.length >= 2 && !hasLinks(children[0]) && hasLinks(children[1]);
  };
  const walk = node => {
    if (!React.isValidElement(node)) return { node, rank: Infinity };
    const path = typeof node.props.to === "string" ? node.props.to : node.props.to?.pathname;
    if (path) return { node, rank: ranks.get(normalize(path)) ?? Infinity };
    const children = React.Children.toArray(node.props.children).map((child, index) => ({ ...walk(child), index }));
    const rank = Math.min(Infinity, ...children.map(child => child.rank));
    if (rank === Infinity) return { node, rank };
    // Only move menu entries, never accordion summaries, icons, styles or layout wrappers.
    const ordered = children.filter(child => isMenuEntry(child.node)).sort((a, b) => a.rank - b.rank || a.index - b.index);
    let index = 0;
    children.forEach((child, i) => { if (isMenuEntry(child.node)) children[i] = ordered[index++]; });
    return { node: React.cloneElement(node, node.props, children.map(child => child.node)), rank };
  };
  return walk(tree).node;
}
