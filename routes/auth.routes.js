// POST /api/auth/logout
// Always returns success (idempotent logout)
router.post("/logout", async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const [type, token] = auth.split(" ");

    // No token? treat as already logged out
    if (type !== "Bearer" || !token) {
      return res.json({ message: "Logged out successfully" });
    }

    // If already blacklisted, treat as success
    const exists = await prisma.tokenBlacklist.findUnique({ where: { token } });
    if (exists) {
      return res.json({ message: "Logged out successfully" });
    }

    // Determine expiry (best effort)
    let expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // fallback 7d
    try {
      const decoded = jwt.decode(token);
      if (decoded?.exp) expiresAt = new Date(decoded.exp * 1000);
    } catch {
      // ignore decode issues
    }

    await prisma.tokenBlacklist.create({
      data: { token, expiresAt },
    });

    return res.json({ message: "Logged out successfully" });
  } catch (e) {
    // If unique constraint hit anyway, still success
    if (e?.code === "P2002") return res.json({ message: "Logged out successfully" });
    next(e);
  }
});
