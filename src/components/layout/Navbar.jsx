import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { useWallet } from "../../context/WalletContext";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const {
    isConnected,
    isCorrectNetwork,
    isConnecting,
    isSwitching,
    address,
    truncatedAddress,
    networkName,
    expectedName,
    error,
    balance,
    balanceLoading,
    balanceError,
    connect,
    disconnect,
    switchNetwork,
    fetchBalance,
    clearError,
  } = useWallet();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Properties", href: "/properties" },
    { name: "About", href: "/about" },
    { name: "FAQ", href: "/faq" },
    { name: "Blog", href: "/blog" },
  ];

  // ── Balance row (inside dropdown) ────────────────────────────
  const BalanceRow = () => {
    if (balanceLoading)
      return (
        <div className="flex items-center justify-between py-2 px-2 mb-2 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-400">Balance</span>
          <span className="text-xs text-gray-400 animate-pulse">Fetching…</span>
        </div>
      );
    if (balanceError === "wrong_network") return null; // covered by network banner
    if (balanceError === "rpc_error")
      return (
        <div className="flex items-center justify-between py-2 px-2 mb-2 bg-red-50 rounded-lg">
          <span className="text-xs text-red-400">Balance unavailable</span>
          <button
            onClick={fetchBalance}
            className="text-xs text-red-500 underline"
          >
            Retry
          </button>
        </div>
      );
    if (balance)
      return (
        <div className="flex items-center justify-between py-2 px-2 mb-2 bg-blue-50 rounded-lg">
          <span className="text-xs text-gray-500">Balance</span>
          <span className="text-sm font-bold text-primary-600">{balance}</span>
        </div>
      );
    return null;
  };

  // ── Network status pill (inside dropdown) ────────────────────
  const NetworkStatus = () => {
    if (!isConnected) return null;
    if (isCorrectNetwork)
      return (
        <div className="flex items-center gap-1.5 py-1.5 px-2 mb-2 bg-green-50 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          <span className="text-xs text-green-700 font-medium">
            {networkName} — correct network
          </span>
        </div>
      );
    return (
      <div className="mb-2">
        <div className="flex items-center gap-1.5 py-1.5 px-2 bg-yellow-50 rounded-lg mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
          <span className="text-xs text-yellow-700 font-medium">
            Wrong network{networkName ? `: ${networkName}` : ""}
          </span>
        </div>
        <button
          onClick={switchNetwork}
          disabled={isSwitching}
          className="w-full py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors"
        >
          {isSwitching ? "Switching…" : `Switch to ${expectedName}`}
        </button>
      </div>
    );
  };

  // ── Address pill colour — green if correct network, amber if not ──
  const pillClass = isConnected
    ? isCorrectNetwork
      ? "border-green-500 bg-green-50 text-green-800 hover:bg-green-100"
      : "border-yellow-400 bg-yellow-50 text-yellow-800 hover:bg-yellow-100"
    : "";

  const dotColor = isCorrectNetwork ? "bg-green-500" : "bg-yellow-400";

  return (
    <>
      <nav className="glass-nav sticky top-0 z-50">
        <div className="container">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center">
                <svg
                  width="30"
                  height="35"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="15" cy="20" r="10" stroke="#2660d3" />
                  <circle
                    cx="15"
                    cy="20"
                    r="6"
                    stroke="#2660d3"
                    strokeWidth="3"
                  />
                </svg>
                <span className="text-2xl font-bold text-primary-600 mt-1.5">
                  GoldenProp
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-sapphire-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors duration-300 relative group"
                >
                  {item.name}
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </Link>
              ))}

              {/* ── Connect / Wallet button (desktop) ── */}
              {error === "no_wallet" ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-red-500">No wallet found.</span>
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 underline whitespace-nowrap"
                  >
                    Install MetaMask ↗
                  </a>
                  <button
                    onClick={clearError}
                    className="text-secondary-400 hover:text-secondary-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : error === "rejected" ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-red-500">Request rejected.</span>
                  <button
                    className="btn"
                    onClick={() => {
                      clearError();
                      connect();
                    }}
                  >
                    Try Again
                  </button>
                  <button
                    onClick={clearError}
                    className="text-secondary-400 hover:text-secondary-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : isConnected ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 text-sm font-semibold transition-colors ${pillClass}`}
                    title={address}
                  >
                    <span
                      className={`w-2 h-2 rounded-full inline-block ${dotColor}`}
                    />
                    {truncatedAddress}
                    {networkName && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          isCorrectNetwork
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {networkName}
                      </span>
                    )}
                    <span className="text-xs opacity-50">
                      {dropdownOpen ? "▲" : "▼"}
                    </span>
                  </button>

                  {dropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-68 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50"
                      style={{ minWidth: "260px" }}
                    >
                      <p className="text-xs text-gray-400 font-mono break-all bg-gray-50 px-2 py-1.5 rounded mb-2">
                        {address}
                      </p>
                      {/* Network status + optional switch button */}
                      <NetworkStatus />
                      {/* Balance */}
                      <BalanceRow />
                      <button
                        onClick={() => {
                          disconnect();
                          setDropdownOpen(false);
                        }}
                        className="w-full py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  className="btn"
                  onClick={connect}
                  disabled={isConnecting}
                >
                  {isConnecting ? "Connecting…" : "Connect"}
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                className="text-secondary-600 hover:text-primary-600"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="md:hidden">
              <div className="pt-2 pb-3 space-y-1 bg-glass backdrop-blur-xl rounded-b-2xl border-t border-glass">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="block px-3 py-2 text-base font-medium text-sapphire-700 hover:text-primary-600 hover:bg-glass-light rounded-xl mx-2 transition-all duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                {/* ── Connect / Wallet button (mobile) ── */}
                {error === "no_wallet" ? (
                  <div className="px-3 py-2 text-sm">
                    <span className="text-red-500">No wallet found. </span>
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-600 underline"
                    >
                      Install MetaMask ↗
                    </a>
                  </div>
                ) : error === "rejected" ? (
                  <div className="px-3 py-2 flex items-center gap-3 text-sm">
                    <span className="text-red-500">Request rejected.</span>
                    <button
                      className="text-primary-600 font-semibold underline"
                      onClick={() => {
                        clearError();
                        connect();
                      }}
                    >
                      Try Again
                    </button>
                  </div>
                ) : isConnected ? (
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full inline-block ${dotColor}`}
                      />
                      <span
                        className={`text-sm font-semibold ${isCorrectNetwork ? "text-green-700" : "text-yellow-700"}`}
                      >
                        {truncatedAddress}
                      </span>
                      {networkName && (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            isCorrectNetwork
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {networkName}
                        </span>
                      )}
                    </div>

                    {/* Wrong network warning + switch button (mobile) */}
                    {!isCorrectNetwork && (
                      <div className="mb-2">
                        <p className="text-xs text-yellow-700 mb-1">
                          Wrong network — switch to {expectedName}
                        </p>
                        <button
                          onClick={switchNetwork}
                          disabled={isSwitching}
                          className="text-xs text-primary-600 font-semibold underline disabled:opacity-60"
                        >
                          {isSwitching
                            ? "Switching…"
                            : `Switch to ${expectedName}`}
                        </button>
                      </div>
                    )}

                    {/* Balance (mobile) */}
                    {balanceLoading && (
                      <p className="text-xs text-gray-400 animate-pulse mb-1">
                        Fetching balance…
                      </p>
                    )}
                    {balanceError === "rpc_error" && (
                      <button
                        onClick={fetchBalance}
                        className="text-xs text-red-500 underline mb-1"
                      >
                        Balance unavailable — Retry
                      </button>
                    )}
                    {balance && !balanceLoading && (
                      <p className="text-sm font-bold text-primary-600 mb-1">
                        {balance}
                      </p>
                    )}

                    <button
                      onClick={() => {
                        disconnect();
                        setIsOpen(false);
                      }}
                      className="text-sm text-red-600 font-semibold hover:underline"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    className="block px-3 py-2 text-base font-medium text-white bg-primary-600 hover:bg-primary-700"
                    onClick={() => {
                      setIsOpen(false);
                      connect();
                    }}
                    disabled={isConnecting}
                  >
                    {isConnecting ? "Connecting…" : "Connect"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Full-width wrong-network banner below navbar ── */}
      {isConnected && !isCorrectNetwork && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center justify-between gap-4">
          <p className="text-sm text-yellow-800">
            ⚠️ You're on{" "}
            <strong>{networkName ?? "an unsupported network"}</strong>. Actions
            requiring transactions are disabled until you switch to{" "}
            <strong>{expectedName}</strong>.
          </p>
          <button
            onClick={switchNetwork}
            disabled={isSwitching}
            className="shrink-0 text-xs font-semibold text-white bg-yellow-500 hover:bg-yellow-600 px-3 py-1.5 rounded-lg disabled:opacity-60 transition-colors"
          >
            {isSwitching ? "Switching…" : `Switch to ${expectedName}`}
          </button>
        </div>
      )}
    </>
  );
}

export default Navbar;
