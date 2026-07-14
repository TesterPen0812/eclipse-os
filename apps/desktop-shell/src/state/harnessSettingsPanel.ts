import { createDefaultAgentRegistry } from "@eclipse-os/harness-core";
import {
  EclipseHarnessSettingsStore,
  MemoryKeyValueStorage,
  type KeyValueStorage,
} from "@eclipse-os/harness-eclipse";

const PANEL_ID = "eclipse-harness-settings";

export function mountHarnessSettingsPanel(): void {
  const pane = document.querySelector<HTMLElement>('.pane[data-pane="general"]');
  if (!pane || document.getElementById(PANEL_ID)) return;

  const storage = createBrowserStorage();
  const settingsStore = new EclipseHarnessSettingsStore(storage);
  const registry = createDefaultAgentRegistry(settingsStore.getSelectedProviderId());
  const providers = registry.listProviders();
  const selectedProviderId = registry.snapshot().selectedProviderId;
  settingsStore.setSelectedProviderId(selectedProviderId);

  const group = document.createElement("div");
  group.className = "group";
  group.id = PANEL_ID;
  group.innerHTML =
    '<div class="group-h">Agent harness</div>' +
    '<div class="card">' +
    '<div class="crow">' +
    '<div class="crow-txt">' +
    '<div class="crow-title">Default provider</div>' +
    '<div class="crow-desc">Used by new Eclipse OS threads in the desktop shell</div>' +
    '</div>' +
    '<div class="crow-ctl"><div class="sel"><select aria-label="Default harness provider" id="harnessProviderSelect">' +
    providers
      .map(
        (provider) =>
          '<option value="' +
          escapeAttribute(provider.id) +
          '"' +
          (provider.id === selectedProviderId ? " selected" : "") +
          ">" +
          escapeHtml(provider.label) +
          " - " +
          escapeHtml(provider.status) +
          "</option>",
      )
      .join("") +
    '</select><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9.3 12 14.2l5-4.9"/></svg></div></div>' +
    '</div>' +
    '<div class="crow">' +
    '<div class="crow-txt">' +
    '<div class="crow-title">Secrets boundary</div>' +
    '<div class="crow-desc">API keys stay in env, OS keychain, or a secure backend; this shell stores only provider choice and local thread data.</div>' +
    '</div>' +
    '<div class="crow-ctl"><div class="seg"><button type="button" class="on">local</button></div></div>' +
    '</div>' +
    '<div class="crow">' +
    '<div class="crow-txt">' +
    '<div class="crow-title">Unsupported sync</div>' +
    '<div class="crow-desc">ChatGPT consumer subscription sync and private endpoint access are not implemented.</div>' +
    '</div>' +
    '<div class="crow-ctl"><div class="seg"><button type="button" class="on">roadmap</button></div></div>' +
    '</div>' +
    '</div>';

  const firstGroup = pane.querySelector(".group");
  if (firstGroup) {
    firstGroup.insertAdjacentElement("beforebegin", group);
  } else {
    pane.appendChild(group);
  }

  const select = group.querySelector<HTMLSelectElement>("#harnessProviderSelect");
  select?.addEventListener("change", function () {
    settingsStore.setSelectedProviderId(select.value);
  });
}

function createBrowserStorage(): KeyValueStorage {
  try {
    const storage = window.localStorage;
    const probe = "__eclipse_os_settings_storage_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return new MemoryKeyValueStorage();
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
}
