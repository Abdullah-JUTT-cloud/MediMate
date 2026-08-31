// @vitest-environment jsdom
// Regression guard for the "white screen on reload" bug. The production
// bundle used to crash at load with `Cannot read properties of undefined
// (reading 'memo')` because the manualChunks config created a circular chunk
// (vendor → vendor-core → vendor). This mounts the real <App /> across a
// matrix of deep routes and persisted localStorage states and fails if the
// root renders empty (i.e. React never mounted) or any fatal error fires.
import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import App from "../App.jsx";

function polyfill() {
  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
  window.scrollTo = () => {};
  Element.prototype.scrollTo = () => {};
  Element.prototype.scrollIntoView = () => {};
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
  }
  if (!window.ResizeObserver) {
    window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  }
  if (!window.MutationObserver) {
    window.MutationObserver = class { observe() {} disconnect() {} takeRecords() { return []; } };
  }
  window.speechSynthesis = { cancel: () => {}, getVoices: () => [], speak: () => {} };
  window.SpeechSynthesisUtterance = class {};
}

const ROUTES = ["/", "/dashboard", "/book/doctors", "/book/dashboard", "/admin", "/login"];

const STATES = [
  { label: "fresh", setup: () => window.localStorage.clear() },
  {
    label: "doctor-authed",
    setup: () => {
      window.localStorage.clear();
      window.localStorage.setItem(
        "medimate-auth",
        JSON.stringify({ state: { doctor: { _id: "d1", name: "Dr. A" } }, version: 0 }),
      );
    },
  },
  {
    label: "corrupt-storage",
    setup: () => {
      window.localStorage.clear();
      window.localStorage.setItem("medimate-auth", "{not-json");
      window.localStorage.setItem("medalerto-patient-auth", "}}}}");
    },
  },
];

describe("reload smoke tests (deep routes + persisted state)", () => {
  beforeAll(polyfill);

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  for (const state of STATES) {
    for (const route of ROUTES) {
      it(`renders without white-screen crash: [${state.label}] ${route}`, async () => {
        state.setup();
        window.history.replaceState({}, "", route);

        const errors = [];
        const onError = (e) => errors.push("err:" + (e?.message || e));
        const onRejection = (e) => errors.push("rej:" + (e?.reason?.message || e?.reason || e));
        window.addEventListener("error", onError);
        window.addEventListener("unhandledrejection", onRejection);

        let caught = null;
        let container;
        try {
          const rendered = render(<App />);
          container = rendered.container;
        } catch (e) {
          caught = e;
        }

        await act(async () => {
          await new Promise((r) => setTimeout(r, 800));
        });

        const fatalErrors = errors.filter(
          (x) => !/ResizeObserver|matchMedia|scrollTo|speechSynthesis|fetch|network|WebSocket|socket/i.test(x),
        );

        if (caught) throw new Error(`render threw [${state.label}] ${route}: ${caught.message}`);
        expect(fatalErrors).toEqual([]);
        expect(container.innerHTML.length).toBeGreaterThan(0);
      }, 20000);
    }
  }
});
