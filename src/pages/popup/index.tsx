import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BsKey, BsTrash, BsBoxArrowUpRight, BsCheckCircle, BsExclamationTriangle } from "react-icons/bs";
import Logo from "@assets/img/icon-128.png";
import "@assets/styles/tailwind.css"
import { storage, tabs } from "webextension-polyfill";

function Popup() {
    const [rotKey, setRotKey] = useState<string | null>(null);
    const [inputRotKey, setInputRotKey] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function getKey() {
        try {
            setIsLoading(true);
            
            const out = await storage.local.get("rot_key");

            if (out.rot_key)
                setRotKey(out.rot_key as string);
        } catch (e) {
            setRotKey(null);
            setError("Failed to retrieve key");
        } finally {
            setIsLoading(false);
        }
    }

    async function deleteKey() {
        try {
            setIsLoading(true);
            await storage.local.remove("rot_key");
            setRotKey(null);
            setError(null);
        } catch (e) {
            setError("Failed to delete key");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSubmit(ev: React.FormEvent) {
        ev.preventDefault();
        if (!inputRotKey.trim()) {
            setError("Please enter a valid key");
            return;
        }
        
        try {
            setIsLoading(true);
            setError(null);
            await storage.local.set({ rot_key: inputRotKey });
            setRotKey(inputRotKey);
            setInputRotKey("");
        } catch (e) {
            setError("Failed to save key");
        } finally {
            setIsLoading(false);
        }
    }

    function openWebsite(extensionKeysPage = false) {
        if (!extensionKeysPage)
            tabs.create({ url: "https://www.badclients.app" });
        else
            tabs.create({ url: "https://www.badclients.app/auth/profile/extension_keys" });
    }

    useEffect(() => {
        getKey();
    }, []);

    return (
        <div className="w-[200px] h-[300px] bg-base-100 flex flex-col">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-base-300 px-4 py-3">
                <button 
                    onClick={() => openWebsite()}
                    className="btn btn-ghost btn-sm w-full flex items-center gap-2 hover:bg-base-200/50"
                >
                    <img src={Logo} width={24} height={24} alt="logo" className="rounded" />
                    <span className="font-semibold text-sm">Bad Clients</span>
                    <BsBoxArrowUpRight className="w-3 h-3 ml-auto opacity-60" />
                </button>
            </div>
            <div className="flex-1 p-4 space-y-4">
                {error && (
                    <div className="alert alert-error alert-sm">
                        <BsExclamationTriangle className="w-4 h-4" />
                        <span className="text-xs">{error}</span>
                    </div>
                )}
                {rotKey !== null ? (
                    <div className="space-y-4">
                        <div className="card bg-success/10 border border-success/20">
                            <div className="card-body p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <BsCheckCircle className="w-4 h-4 text-success" />
                                    <h3 className="text-sm font-semibold text-success">Key Active</h3>
                                </div>
                                <p className="text-xs opacity-70">Your extension key is configured and ready to use.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button 
                                className="btn btn-outline btn-error btn-sm"
                                onClick={deleteKey}
                                disabled={isLoading}
                            >
                                <BsTrash className="w-3 h-3" />
                                {isLoading ? "Removing..." : "Remove Key"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="text-center">
                            <BsKey className="w-8 h-8 mx-auto text-base-content/40 mb-2" />
                            <h3 className="font-semibold text-sm mb-1">Setup Required</h3>
                            <p className="text-xs text-base-content/60">Enter your extension key to get started</p>
                        </div>

                        <div className="space-y-3">
                            <div className="form-control">
                                <input 
                                    type="text" 
                                    placeholder="Enter extension key..."
                                    className="input input-bordered input-sm w-full"
                                    value={inputRotKey}
                                    onChange={(ev) => setInputRotKey(ev.target.value)}
                                    disabled={isLoading}
                                    onKeyDown={(ev) => ev.key === 'Enter' && handleSubmit(ev)}
                                />
                            </div>
                            
                            <button 
                                onClick={handleSubmit}
                                className="btn btn-primary btn-sm w-full"
                                disabled={isLoading || !inputRotKey.trim()}
                            >
                                {isLoading ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                    <BsKey className="w-3 h-3" />
                                )}
                                {isLoading ? "Saving..." : "Save Key"}
                            </button>
                            <button 
                                onClick={() => openWebsite(true)}
                                className="btn btn-sm w-full"
                            >
                                Get Key
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function init() {
    const rootContainer = document.querySelector("#__root");
    if (!rootContainer) throw new Error("Can't find Popup root element");
    const root = createRoot(rootContainer);
    root.render(<Popup />);
}

init();
