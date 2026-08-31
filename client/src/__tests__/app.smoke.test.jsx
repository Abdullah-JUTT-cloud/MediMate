// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import App from "../App.jsx";

// ── jsdom polyfills for APIs the app expects in a real browser ──────────────
beforeAll(() => {
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
  if (!window.scrollTo) window.scrollTo = () => {};
  if (!Element.prototype.scrollTo) Element.prototype.scrollTo = () => {};
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    };
  }
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!window.MutationObserver) {
    window.MutationObserver = class {
      observe() {}
      disconnect() {}
      takeRecords() { return []; }
    };
  }
  if (!window.speechSynthesis) {
    window.speechSynthesis = {
      cancel: () => {},
      getVoices: () => [],
      speak: () => {},
    };
  }
  if (!window.SpeechSynthesisUtterance) {
    window.SpeechSynthesisUtterance = class {};
  }
  // LocalStorage persists between tests in the same file; clear to simulate a fresh reload.
  window.localStorage.clear();
});

describe("App root smoke test", () => {
  it("renders the landing page without crashing", async () => {
    const errors = [];
    const onError = (e) => errors.push(String(e?.message || e));
    const onRejection = (e) => errors.push(String(e?.reason?.message || e?.reason || e));
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    let caughtRenderError = null;
    let container;
    try {
      const rendered = render(<App />);
      container = rendered.container;
    } catch (e) {
      caughtRenderError = e;
    }

    // Allow lazy route chunks to resolve and effects to run.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 2000));
    });

    if (caughtRenderError) throw caughtRenderError;
    if (errors.length) throw new Error("window errors: " + errors.join(" | "));

    expect(container.innerHTML.length).toBeGreaterThan(0);
    await waitFor(
      () => {
        expect(container.textContent).toMatch(/MEDALERTO|MedAlerto|clinic|doctor/i);
      },
      { timeout: 4000 },
    );
  }, 30000);
});
