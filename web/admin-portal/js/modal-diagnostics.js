// =========================================================
// MODAL DIAGNOSTICS
// =========================================================

(function () {
  function logModalState(context) {
    const overlays = Array.from(document.querySelectorAll(".nf-modal-overlay"));
    const panelsInPageContent = Array.from(
      document.querySelectorAll("#pageContent .nf-modal"),
    );

    console.group(`NF Modal Diagnostics: ${context}`);
    console.log("Overlays in <body>:", overlays.length);
    overlays.forEach((o, i) => {
      console.log(
        `  [${i}] id=${o.id || "(no id)"}, data-page=${o.getAttribute(
          "data-page",
        )}, parent=`,
        o.parentElement === document.body ? "<body>" : o.parentElement,
      );
    });

    if (panelsInPageContent.length > 0) {
      console.warn(
        "Found .nf-modal elements INSIDE #pageContent (this is wrong, they should only live inside .nf-modal-overlay in <body>):",
        panelsInPageContent,
      );
    } else {
      console.log(
        "No .nf-modal panels inside #pageContent — structure looks correct.",
      );
    }

    console.groupEnd();
  }

  document.addEventListener("nf-page-ready", () => {
    logModalState("nf-page-ready");
  });

  // Optional: expose manual trigger
  window.NFModalDiagnostics = {
    log: () => logModalState("manual"),
  };
})();
