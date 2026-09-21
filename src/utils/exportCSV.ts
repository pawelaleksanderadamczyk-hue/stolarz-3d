export function exportCSVToFile(csvContent: string) {
  const defaultName = `formatki-${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, "-")}.csv`;

  // ✅ wybór nazwy i miejsca zapisu
  if ("showSaveFilePicker" in window) {
    (async () => {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: defaultName,
          types: [
            {
              description: "Plik CSV",
              accept: { "text/csv": [".csv"] },
            },
          ],
        });

        const writable = await handle.createWritable();
        await writable.write(csvContent);
        await writable.close();
      } catch (err) {
        console.error("Export anulowany:", err);
      }
    })();
    return;
  }

  // 🔻 fallback
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = defaultName;
  a.click();

  URL.revokeObjectURL(url);
}