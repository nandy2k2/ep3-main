import React from "react";
import { orderMenuTree } from "./menuOrder";
const link = (path, label) => <a key={path} to={path}>{label}</a>;
const paths = tree => React.Children.toArray(tree.props.children).map(node => node.props.to);
test("legacy menus remain unchanged when order is absent", () => {
  const tree = <div>{link("/b", "B")}{link("/a", "A")}</div>;
  expect(orderMenuTree(tree, [{ role: "Faculty", path: "/a", access: "Allow" }], "Faculty")).toBe(tree);
});
test("sorts explicit numeric orders including zero, preserving unspecified relative order", () => {
  const tree = <div>{link("/b", "B")}{link("/a", "A")}{link("/c", "C")}{link("/d", "D")}</div>;
  const rules = [{ role: "Faculty", path: "/c", access: "Allow", order: 2 }, { role: "Faculty", path: "/d", access: "Allow", order: 0 }, { role: "Other", path: "/a", access: "Allow", order: -1 }];
  expect(paths(orderMenuTree(tree, rules, "Faculty"))).toEqual(["/d", "/c", "/b", "/a"]);
});
test("sorts groups without moving summaries below details", () => {
  const group = (title, path) => <section key={title}><header>{title}</header><div>{link(path, title)}</div></section>;
  const tree = <main>{group("B", "/b")}{group("A", "/a")}</main>;
  const sorted = orderMenuTree(tree, [{ role: "All", path: "/a", access: "Allow", order: 1 }], "Faculty");
  const first = React.Children.toArray(sorted.props.children)[0];
  expect(first.props.children[0].type).toBe("header");
  expect(first.props.children[0].props.children).toBe("A");
});
