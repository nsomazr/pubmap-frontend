import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Cloud, HardDrive, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../lib/api";
import { isPlatformAdmin } from "../../lib/userAccess";

type LlmProviderId = "gemini" | "groq" | "ollama";

type LlmSettingsPayload = {
  settings: {
    provider: LlmProviderId;
    gemini_model: string;
    groq_model: string;
    groq_model_fallbacks: string;
    ollama_base_url: string;
    ollama_model: string;
    quality_gate_enabled: boolean;
    updated_at: string | null;
  };
  runtime: {
    source: string;
    active_provider: string;
    active_model: string;
  };
  providers: { id: LlmProviderId; label: string }[];
  gemini_models: { id: string; label: string }[];
  groq_models: { id: string; label: string }[];
  ollama_models: { name: string; size: string; modified: string }[];
  health: {
    available?: boolean;
    hint?: string;
    model?: string;
    ollama_reachable?: boolean;
    gemini_api_key_set?: boolean;
    groq_api_key_set?: boolean;
  };
};

export function AdminLlmSettingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [provider, setProvider] = useState<LlmProviderId>("gemini");
  const [geminiModel, setGeminiModel] = useState("gemini-2.0-flash");
  const [groqModel, setGroqModel] = useState("");
  const [groqFallbacks, setGroqFallbacks] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://127.0.0.1:11434");
  const [ollamaModel, setOllamaModel] = useState("qwen3.5:0.8b");
  const [qualityGateEnabled, setQualityGateEnabled] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-llm-settings"],
    queryFn: async () => {
      const { data: payload } = await api.get<LlmSettingsPayload>("/admin/llm-settings/");
      return payload;
    },
    enabled: isPlatformAdmin(user),
  });

  useEffect(() => {
    if (!data?.settings) return;
    setProvider(data.settings.provider);
    setGeminiModel(data.settings.gemini_model);
    setGroqModel(data.settings.groq_model);
    setGroqFallbacks(data.settings.groq_model_fallbacks);
    setOllamaUrl(data.settings.ollama_base_url);
    setOllamaModel(data.settings.ollama_model);
    setQualityGateEnabled(Boolean(data.settings.quality_gate_enabled));
  }, [data]);

  const refreshOllama = useMutation({
    mutationFn: async () => {
      const { data: payload } = await api.get<{ ollama_models: LlmSettingsPayload["ollama_models"] }>(
        "/admin/llm-settings/ollama-models/",
        { params: { base_url: ollamaUrl } }
      );
      return payload.ollama_models;
    },
    onSuccess: (models) => {
      queryClient.setQueryData<LlmSettingsPayload | undefined>(
        ["admin-llm-settings"],
        (prev) => (prev ? { ...prev, ollama_models: models } : prev)
      );
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: payload } = await api.patch<LlmSettingsPayload>("/admin/llm-settings/", {
        provider,
        gemini_model: geminiModel,
        groq_model: groqModel,
        groq_model_fallbacks: groqFallbacks,
        ollama_base_url: ollamaUrl,
        ollama_model: ollamaModel,
        quality_gate_enabled: qualityGateEnabled,
      });
      return payload;
    },
    onSuccess: (payload) => {
      queryClient.setQueryData(["admin-llm-settings"], payload);
      if (payload.settings) {
        setProvider(payload.settings.provider);
        setGeminiModel(payload.settings.gemini_model);
        setGroqModel(payload.settings.groq_model);
        setGroqFallbacks(payload.settings.groq_model_fallbacks);
        setOllamaUrl(payload.settings.ollama_base_url);
        setOllamaModel(payload.settings.ollama_model);
        setQualityGateEnabled(Boolean(payload.settings.quality_gate_enabled));
      }
      toast.success({ title: "Assistant settings saved." });
    },
    onError: () => {
      toast.error({ title: "Could not save assistant settings." });
    },
  });

  if (!isPlatformAdmin(user)) return <Navigate to="/dashboard" replace />;

  const ollamaModels = data?.ollama_models ?? [];
  const geminiModels = data?.gemini_models ?? [];
  const groqModels = data?.groq_models ?? [];
  const health = data?.health;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Assistant settings"
        description="Choose Gemini, Groq, or local Ollama for Research Assistant, manuscript autofill, and funder extraction. Optionally enable the quality gate so a judge model auto-switches provider when output is weak."
      />

      {isLoading && (
        <p className="text-sm text-slate-500">Loading assistant configuration…</p>
      )}
      {isError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load assistant settings. Ensure the API migration has been applied.
        </p>
      )}

      {data && (
        <>
          <section className="gre-panel">
            <div className="gre-panel__head flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Bot className="h-4 w-4 text-brand-600" />
                Runtime status
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  health?.available
                    ? "bg-teal-50 text-teal-800 ring-1 ring-teal-200"
                    : "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                }`}
              >
                {health?.available ? "Connected" : "Unavailable"}
              </span>
            </div>
            <div className="gre-panel__body space-y-3 p-5">
            <dl className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Active provider
                </dt>
                <dd className="font-medium text-ink">{data.runtime.active_provider}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Active model
                </dt>
                <dd className="font-medium text-ink">{data.runtime.active_model}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Config source
                </dt>
                <dd>{data.runtime.source}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Gemini configured
                </dt>
                <dd>{health?.gemini_api_key_set ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Groq configured
                </dt>
                <dd>{health?.groq_api_key_set ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Ollama reachable
                </dt>
                <dd>{health?.ollama_reachable ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Quality gate
                </dt>
                <dd>{qualityGateEnabled ? "On (judge fallback)" : "Off"}</dd>
              </div>
            </dl>
            {health?.hint && !health.available && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {health.hint}
              </p>
            )}
            </div>
          </section>

          <section className="gre-panel">
            <div className="gre-panel__head px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">Auto quality gate</h2>
                <p className="mt-1 max-w-xl text-xs text-slate-500">
                  When enabled, GRE uses a judge model to score each response. If output is
                  insufficient, it automatically tries the next provider or Groq fallback model.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gre-border text-brand-600 focus:ring-brand-500"
                  checked={qualityGateEnabled}
                  onChange={(e) => setQualityGateEnabled(e.target.checked)}
                />
                Enable judge fallback
              </label>
            </div>
            </div>
          </section>

          <section className="gre-panel">
            <div className="gre-panel__head px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">Provider</h2>
            </div>
            <div className="gre-panel__body flex flex-wrap gap-3 p-5">
              {(data.providers ?? []).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setProvider(item.id)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    provider === item.id
                      ? "border-brand-500 bg-brand-50 text-brand-800"
                      : "border-gre-border bg-gre-panel text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {item.id === "gemini" ? (
                    <Sparkles className="h-4 w-4" />
                  ) : item.id === "groq" ? (
                    <Cloud className="h-4 w-4" />
                  ) : (
                    <HardDrive className="h-4 w-4" />
                  )}
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          {provider === "gemini" && (
            <section className="gre-panel">
              <div className="gre-panel__head px-5 py-4">
              <h2 className="text-sm font-semibold text-ink">Gemini models</h2>
              </div>
              <div className="gre-panel__body space-y-4 p-5">
              <label className="block text-sm font-medium text-slate-700">
                Primary model
                <select
                  className="mt-1 w-full rounded-xl border border-gre-border px-3 py-2.5 text-sm"
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                >
                  {geminiModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                  {geminiModel && !geminiModels.some((m) => m.id === geminiModel) && (
                    <option value={geminiModel}>{geminiModel}</option>
                  )}
                </select>
              </label>
              {!health?.gemini_api_key_set ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Gemini credentials are not configured on the server yet. Add them before selecting
                  Gemini as the active provider.
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Gemini is configured on the server. Save to use it as the primary provider.
                </p>
              )}
              </div>
            </section>
          )}

          {provider === "groq" && (
            <section className="gre-panel">
              <div className="gre-panel__head px-5 py-4">
              <h2 className="text-sm font-semibold text-ink">Groq models</h2>
              </div>
              <div className="gre-panel__body space-y-4 p-5">
              <label className="block text-sm font-medium text-slate-700">
                Primary model
                <select
                  className="mt-1 w-full rounded-xl border border-gre-border px-3 py-2.5 text-sm"
                  value={groqModel}
                  onChange={(e) => setGroqModel(e.target.value)}
                >
                  {groqModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                  {groqModel && !groqModels.some((m) => m.id === groqModel) && (
                    <option value={groqModel}>{groqModel}</option>
                  )}
                </select>
              </label>
              <Input
                label="Fallback models (comma-separated)"
                value={groqFallbacks}
                onChange={(e) => setGroqFallbacks(e.target.value)}
                placeholder="llama-3.1-8b-instant, openai/gpt-oss-20b"
              />
              <p className="text-xs text-slate-500">
                Requires GROQ credentials in the server environment.
              </p>
              </div>
            </section>
          )}

          {provider === "ollama" && (
            <section className="gre-panel">
              <div className="gre-panel__head flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                <h2 className="text-sm font-semibold text-ink">Ollama (local)</h2>
                <Button
                  type="button"
                  variant="secondary"
                  className="!py-2 !px-3 text-xs"
                  onClick={() => refreshOllama.mutate()}
                  disabled={refreshOllama.isPending}
                >
                  <RefreshCw
                    className={`mr-1.5 h-3.5 w-3.5 ${refreshOllama.isPending ? "animate-spin" : ""}`}
                  />
                  Refresh models
                </Button>
              </div>
              <div className="gre-panel__body space-y-4 p-5">
              <Input
                label="Ollama base URL"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://127.0.0.1:11434"
              />
              <label className="block text-sm font-medium text-slate-700">
                Model
                <select
                  className="mt-1 w-full rounded-xl border border-gre-border px-3 py-2.5 text-sm"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                >
                  {ollamaModels.length === 0 && (
                    <option value={ollamaModel}>{ollamaModel} (not detected — refresh)</option>
                  )}
                  {ollamaModels.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                      {m.size ? ` — ${m.size}` : ""}
                    </option>
                  ))}
                  {ollamaModel &&
                    !ollamaModels.some((m) => m.name === ollamaModel) && (
                      <option value={ollamaModel}>{ollamaModel}</option>
                    )}
                </select>
              </label>
              <p className="text-xs text-slate-500">
                Pull models with{" "}
                <code className="rounded bg-slate-100 px-1">ollama pull qwen3.5:0.8b</code> on
                the server running Ollama.
              </p>
              </div>
            </section>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving…" : "Save assistant settings"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
