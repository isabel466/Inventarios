export async function onRequestGet(context) {
  try {
    const result = await context.env.DB
      .prepare("SELECT COUNT(*) AS total FROM usuarios")
      .first();

    return Response.json({
      status: "ok",
      database: "D1 conectada",
      usuarios: result.total
    });
  } catch (error) {
    console.error("Error de conexión D1:", error);

    return Response.json(
      { error: "No se pudo consultar la base de datos" },
      { status: 500 }
    );
  }
}
