"use client";

import { useEffect, useMemo, useState } from "react";

type ChapterOutline = {
  id: string;
  title: string;
  focus: string;
};

type BookIdea = {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  genre: string;
  audience: string;
  tone: string;
  status: "Draft" | "In Progress" | "Polished";
  wordGoal: string;
  synopsis: string;
  hook: string;
  keywords: string[];
  chapters: ChapterOutline[];
  createdAt: string;
};

const initialForm: Omit<BookIdea, "id" | "createdAt"> = {
  title: "",
  subtitle: "",
  author: "",
  genre: "",
  audience: "",
  tone: "",
  status: "Draft",
  wordGoal: "",
  synopsis: "",
  hook: "",
  keywords: [],
  chapters: []
};

const STORAGE_KEY = "book-creator-ideas";

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function cleanKeywords(keywords: string) {
  return keywords
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

export default function Page() {
  const [form, setForm] = useState(initialForm);
  const [keywordInput, setKeywordInput] = useState("");
  const [chapterDraft, setChapterDraft] = useState({ title: "", focus: "" });
  const [ideas, setIdeas] = useState<BookIdea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const selectedIdea = useMemo(
    () => ideas.find((idea) => idea.id === selectedIdeaId) || null,
    [ideas, selectedIdeaId]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as BookIdea[];
      setIdeas(parsed);
      if (parsed.length) {
        setSelectedIdeaId(parsed[0].id);
      }
    } catch (error) {
      console.error("Failed to parse stored ideas", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
  }, [ideas]);

  useEffect(() => {
    setForm(initialForm);
    setKeywordInput("");
    setChapterDraft({ title: "", focus: "" });
    if (selectedIdea) {
      setForm({ ...selectedIdea, keywords: selectedIdea.keywords });
      setKeywordInput(selectedIdea.keywords.join(", "));
    }
  }, [selectedIdea]);

  function updateFormField<K extends keyof typeof initialForm>(key: K, value: (typeof initialForm)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addChapter() {
    if (!chapterDraft.title.trim() && !chapterDraft.focus.trim()) return;
    updateFormField("chapters", [
      ...form.chapters,
      { id: createId(), title: chapterDraft.title.trim(), focus: chapterDraft.focus.trim() }
    ]);
    setChapterDraft({ title: "", focus: "" });
  }

  function removeChapter(id: string) {
    updateFormField(
      "chapters",
      form.chapters.filter((chapter) => chapter.id !== id)
    );
  }

  function resetForm() {
    setForm(initialForm);
    setKeywordInput("");
    setChapterDraft({ title: "", focus: "" });
    setSelectedIdeaId(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const newIdea: BookIdea = {
      id: selectedIdeaId ?? createId(),
      title: form.title.trim() || "Untitled Manuscript",
      subtitle: form.subtitle.trim(),
      author: form.author.trim() || "Anonymous",
      genre: form.genre.trim(),
      audience: form.audience.trim(),
      tone: form.tone.trim(),
      status: form.status,
      wordGoal: form.wordGoal.trim(),
      synopsis: form.synopsis.trim(),
      hook: form.hook.trim(),
      keywords: cleanKeywords(keywordInput),
      chapters: form.chapters,
      createdAt: selectedIdea?.createdAt ?? new Date().toISOString()
    };

    setIdeas((prev) => {
      if (selectedIdeaId) {
        return prev.map((idea) => (idea.id === selectedIdeaId ? newIdea : idea));
      }
      return [newIdea, ...prev];
    });

    setSelectedIdeaId(newIdea.id);
  }

  async function copyToClipboard(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch (error) {
      console.error("clipboard", error);
      return false;
    }
  }

  async function exportIdea(idea: BookIdea) {
    const formatted = JSON.stringify(idea, null, 2);
    const copied = await copyToClipboard(formatted);
    if (!copied) {
      alert("Saved JSON to download instead.");
      const blob = new Blob([formatted], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${idea.title || "book"}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }
  }

  function deleteIdea(id: string) {
    setIdeas((prev) => prev.filter((idea) => idea.id !== id));
    if (selectedIdeaId === id) {
      setSelectedIdeaId(null);
    }
  }

  return (
    <main className="container">
      <section>
        <div className="card grid" style={{ gap: "1.5rem" }}>
          <header>
            <span className="badge">Draft Studio</span>
            <h1>Craft Your Next Book</h1>
            <p>
              Capture book ideas, build chapter outlines, and refine your pitch all in one space.
              Everything saves locally in your browser so you can revisit anytime.
            </p>
          </header>

          <form className="grid" onSubmit={handleSubmit}>
            <h2>1. Core Identity</h2>
            <div className="grid-2">
              <label className="label">
                Title
                <input
                  className="input"
                  value={form.title}
                  onChange={(event) => updateFormField("title", event.target.value)}
                  placeholder="Working title"
                  required
                />
              </label>
              <label className="label">
                Subtitle
                <input
                  className="input"
                  value={form.subtitle}
                  onChange={(event) => updateFormField("subtitle", event.target.value)}
                  placeholder="Optional subtitle"
                />
              </label>
              <label className="label">
                Author
                <input
                  className="input"
                  value={form.author}
                  onChange={(event) => updateFormField("author", event.target.value)}
                  placeholder="Pen name"
                  required
                />
              </label>
              <label className="label">
                Status
                <select
                  className="select"
                  value={form.status}
                  onChange={(event) => updateFormField("status", event.target.value as BookIdea["status"])}
                >
                  <option value="Draft">Draft</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Polished">Polished</option>
                </select>
              </label>
            </div>

            <h2>2. Audience & Positioning</h2>
            <div className="grid-2">
              <label className="label">
                Primary Genre
                <input
                  className="input"
                  value={form.genre}
                  onChange={(event) => updateFormField("genre", event.target.value)}
                  placeholder="Speculative thriller, cozy fantasy..."
                />
              </label>
              <label className="label">
                Target Audience
                <input
                  className="input"
                  value={form.audience}
                  onChange={(event) => updateFormField("audience", event.target.value)}
                  placeholder="Young adults, business leaders..."
                />
              </label>
              <label className="label">
                Narrative Tone
                <input
                  className="input"
                  value={form.tone}
                  onChange={(event) => updateFormField("tone", event.target.value)}
                  placeholder="Playful, investigative, poetic..."
                />
              </label>
              <label className="label">
                Word Count Goal
                <input
                  className="input"
                  value={form.wordGoal}
                  onChange={(event) => updateFormField("wordGoal", event.target.value)}
                  placeholder="80,000"
                  inputMode="numeric"
                />
              </label>
            </div>

            <h2>3. Narrative Blueprint</h2>
            <div className="grid">
              <label className="label">
                Elevator Hook
                <textarea
                  className="textarea"
                  value={form.hook}
                  onChange={(event) => updateFormField("hook", event.target.value)}
                  placeholder="What makes readers grab this from the shelf?"
                />
              </label>
              <label className="label">
                Story Synopsis
                <textarea
                  className="textarea"
                  value={form.synopsis}
                  onChange={(event) => updateFormField("synopsis", event.target.value)}
                  placeholder="Summarize the journey and stakes."
                />
              </label>
              <label className="label">
                Themes & Keywords
                <input
                  className="input"
                  value={keywordInput}
                  onChange={(event) => {
                    setKeywordInput(event.target.value);
                    updateFormField("keywords", cleanKeywords(event.target.value));
                  }}
                  placeholder="Comma separated: resilience, identity, myth"
                />
              </label>
            </div>

            <h2>4. Chapter Path</h2>
            <div className="card" style={{ background: "rgba(15, 23, 42, 0.45)", borderStyle: "dashed" }}>
              <div className="grid-2">
                <label className="label">
                  Chapter Title
                  <input
                    className="input"
                    value={chapterDraft.title}
                    onChange={(event) => setChapterDraft((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="The spark"
                  />
                </label>
                <label className="label">
                  Focus / Beats
                  <input
                    className="input"
                    value={chapterDraft.focus}
                    onChange={(event) => setChapterDraft((prev) => ({ ...prev, focus: event.target.value }))}
                    placeholder="Introduce protagonist, inciting incident"
                  />
                </label>
              </div>
              <button type="button" className="button-secondary" onClick={addChapter}>
                + Add Chapter
              </button>

              {form.chapters.length > 0 && (
                <div className="book-list" style={{ marginTop: "1.5rem" }}>
                  {form.chapters.map((chapter) => (
                    <div key={chapter.id} className="book-item" style={{ borderStyle: "dashed" }}>
                      <div className="utility-row">
                        <div>
                          <div className="book-title">{chapter.title || "Untitled chapter"}</div>
                          <p style={{ marginTop: "0.4rem" }}>{chapter.focus || "Focus TBD"}</p>
                        </div>
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() => removeChapter(chapter.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="utility-row">
              <div className="utility-actions">
                <button type="submit" className="button-primary">
                  {selectedIdeaId ? "Update Idea" : "Save Book Idea"}
                </button>
                <button type="button" className="button-secondary" onClick={resetForm}>
                  Clear Form
                </button>
              </div>
              <small style={{ color: "rgba(148, 163, 184, 0.8)" }}>
                Autosaves locally • use Export to share JSON
              </small>
            </div>
          </form>
        </div>
      </section>

      <section style={{ marginTop: "3rem" }}>
        <header className="utility-row" style={{ marginBottom: "1.2rem" }}>
          <div>
            <h2>Library</h2>
            <p style={{ marginTop: "0.35rem" }}>
              Review previous concepts, export to JSON, or continue refining the outline.
            </p>
          </div>
        </header>

        {ideas.length === 0 ? (
          <div className="card">
            <p>You haven&apos;t saved any ideas yet. Start by filling in the form above.</p>
          </div>
        ) : (
          <div className="book-list">
            {ideas.map((idea) => (
              <article key={idea.id} className="book-item">
                <header>
                  <div>
                    <div className="book-title">{idea.title}</div>
                    <div style={{ color: "rgba(148, 163, 184, 0.85)", marginTop: "0.2rem" }}>
                      {idea.subtitle || "No subtitle"}
                    </div>
                  </div>
                  <div className="tag">{idea.status}</div>
                </header>
                <p style={{ marginTop: "0.7rem" }}>{idea.synopsis || "Synopsis forthcoming."}</p>
                <div className="tag-list">
                  {[idea.genre, idea.audience, idea.tone]
                    .filter(Boolean)
                    .map((item) => (
                      <span key={item} className="tag">
                        {item}
                      </span>
                    ))}
                  {idea.keywords.map((keyword) => (
                    <span key={keyword} className="tag">
                      {keyword}
                    </span>
                  ))}
                </div>
                {idea.chapters.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <strong style={{ color: "rgba(226, 232, 240, 0.9)" }}>Chapters</strong>
                    <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
                      {idea.chapters.map((chapter) => (
                        <li key={chapter.id} style={{ marginBottom: "0.35rem" }}>
                          <span style={{ color: "rgba(226, 232, 240, 0.92)" }}>{chapter.title}</span>
                          {chapter.focus && (
                            <span style={{ color: "rgba(148, 163, 184, 0.85)" }}> – {chapter.focus}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="utility-actions" style={{ marginTop: "1.25rem" }}>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => {
                      setSelectedIdeaId(idea.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="button-secondary" onClick={() => exportIdea(idea)}>
                    Export JSON
                  </button>
                  <button type="button" className="button-secondary" onClick={() => deleteIdea(idea.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
