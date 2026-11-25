import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { Button, OverlayProvider, ThemeProvider, type ButtonProps } from "@virstak/ui";

const props: ButtonProps = { variant: "primary", children: "Server rendered" };
const tree = createElement(ThemeProvider, {
  children: createElement(OverlayProvider, { children: createElement(Button, props) }),
});

if (!/<button[^>]*>Server rendered<\/button>/.test(renderToString(tree))) {
  throw new Error("The packed component did not render on the server.");
}
