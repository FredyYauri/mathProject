import { expect, test, type Page } from '@playwright/test';

// Recorrido completo de una familia nueva, por la interfaz: registro, alta del
// hijo, lección (con error y respuesta revelada), simulacro y vista del padre.
// El contenido es el del seed de desarrollo (backend/prisma/seed.ts).

const PASSWORD = 'clave-e2e-segura';

async function sinScrollHorizontal(page: Page) {
  const { ancho, visible } = await page.evaluate(() => ({
    ancho: document.documentElement.scrollWidth,
    visible: document.documentElement.clientWidth,
  }));
  expect(ancho, 'la página no debe desplazarse a lo ancho').toBeLessThanOrEqual(visible);
}

async function pasarPuertaParental(page: Page) {
  const texto = await page.locator('label[for="respuesta-desafio"]').innerText();
  const [, a, b] = /(\d+)\s*×\s*(\d+)/.exec(texto) ?? [];
  await page.getByLabel(/¿Cuánto es/).fill(String(Number(a) * Number(b)));
  await page.getByRole('button', { name: 'Entrar' }).click();
}

// Responde la pregunta visible probando opciones en orden: si se agotan los
// intentos, marca la que quedó revelada. Siempre termina en "¡Muy bien!".
async function resolverPregunta(page: Page) {
  for (let i = 0; ; i++) {
    const revelada = page.locator('.opcion--revelada');
    if (await revelada.count()) {
      await revelada.click();
    } else {
      await page.locator('.opcion:enabled').nth(i === 0 ? 0 : 1).click();
    }
    const panel = page.locator('.panel-respuesta');
    await expect(panel).toBeVisible();
    if (await panel.getByText('¡Muy bien!').count()) return;
    const reintentar = page.getByRole('button', { name: 'Intentar de nuevo' });
    if (await reintentar.count()) await reintentar.click();
  }
}

test('una familia nueva se registra, el niño juega y el padre ve su progreso', async ({ page }, testInfo) => {
  const email = `familia-${testInfo.project.name}-${Date.now()}@e2e.local`;

  // --- Sin perfil activo, el niño ve que tiene que pedírselo a un adulto
  await page.goto('/');
  await expect(page.getByText('Pídele a un adulto que active tu perfil')).toBeVisible();
  await sinScrollHorizontal(page);

  // --- Puerta parental + registro
  await page.getByRole('link', { name: 'Soy un adulto' }).click();
  await pasarPuertaParental(page);
  await page.getByRole('link', { name: 'Crea tu cuenta' }).click();
  await page.getByLabel('Correo').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Repite la contraseña').fill(PASSWORD);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByText('Para padres, madres y tutores')).toBeVisible(); // sigue en el formulario
  await expect(page.getByLabel('Correo')).toHaveValue(email); // la casilla es obligatoria
  await page.getByLabel(/Declaro que soy mayor de edad/).check();
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  // --- Alta del hijo y activación en el dispositivo
  await expect(page.getByRole('heading', { name: 'Mis hijos' })).toBeVisible();
  await page.getByPlaceholder('Nombre o apodo').fill('Ana');
  await page.getByRole('button', { name: 'Agregar' }).click();
  await expect(page.getByRole('link', { name: 'Ana' })).toBeVisible();
  await sinScrollHorizontal(page);
  await page.getByRole('button', { name: 'Usar en este dispositivo' }).click();

  // --- Mapa: solo el primer nivel disponible
  await expect(page.getByRole('heading', { name: '¡Hola, Ana!' })).toBeVisible();
  await expect(page.locator('.ficha--actual')).toHaveCount(1);
  await expect(page.locator('.ficha--bloqueado')).toHaveCount(5);
  await sinScrollHorizontal(page);

  // --- Lección: dos errores revelan la respuesta, que hay que marcar
  await page.locator('.ficha--actual').click();
  await expect(page.getByRole('heading', { name: '¿Cuántas manzanas hay?' })).toBeVisible();
  await page.getByRole('button', { name: '3', exact: true }).click();
  await expect(page.getByText('Te queda 1 intento.')).toBeVisible();
  await expect(page.getByRole('button', { name: '3', exact: true })).toHaveClass(/opcion--fallo/);
  await page.getByRole('button', { name: 'Intentar de nuevo' }).click();
  await page.getByRole('button', { name: '5', exact: true }).click();
  await expect(page.getByText('¡No pasa nada, así se aprende!')).toBeVisible();
  const correcta = page.getByRole('button', { name: '4', exact: true });
  await expect(correcta).toHaveClass(/opcion--revelada/);
  await expect(page.getByRole('button', { name: '3', exact: true })).toBeDisabled();
  await correcta.click();
  await page.getByRole('button', { name: 'Continuar' }).click();

  // Pregunta con imágenes: el texto ("2 estrellas") no se ve, solo es texto alternativo.
  await expect(page.getByRole('heading', { name: '¿Dónde hay 3 estrellas?' })).toBeVisible();
  for (const opcion of await page.locator('.opcion').all()) {
    await expect(opcion).toHaveText('');
  }
  await page.getByRole('button', { name: '3 estrellas' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();

  await resolverPregunta(page);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await resolverPregunta(page);
  await page.getByRole('button', { name: 'Terminar' }).click();

  await expect(page.getByRole('heading', { name: '¡Lección completada!' })).toBeVisible();
  await sinScrollHorizontal(page);
  await page.getByRole('link', { name: 'Volver al mapa' }).click();
  await expect(page.locator('.ficha--completado')).toHaveCount(1);

  // --- Simulacro
  await page.getByRole('link', { name: '📝 Simulacros' }).click();
  await page.getByRole('link', { name: 'Hacer simulacro' }).click();
  await page.getByRole('button', { name: '¡Comenzar!' }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  await sinScrollHorizontal(page);
  while (!(await page.getByText('¡Terminaste el simulacro!').count())) {
    await page.locator('.opcion:enabled').first().click();
    await page.waitForTimeout(150);
  }
  await expect(page.locator('.cifra-grande')).toHaveText(/\d+%/);
  await sinScrollHorizontal(page);

  // --- El padre vuelve a entrar y ve el progreso
  await page.goto('/padres/login');
  await pasarPuertaParental(page);
  await page.getByLabel('Correo').fill(email);
  await page.getByLabel('Contraseña').fill(PASSWORD);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.getByRole('link', { name: 'Ana' }).click();
  await expect(page.getByRole('heading', { name: 'Progreso de Ana' })).toBeVisible();
  await expect(page.locator('.resumen')).toContainText('1 de 6');
  await expect(page.locator('.resultados-simulacro li')).toHaveCount(1);
  await sinScrollHorizontal(page);

  // --- Cerrar sesión vuelve a la app y la puerta parental se vuelve a pedir
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page.getByRole('heading', { name: '¡Hola, Ana!' })).toBeVisible();
  await page.goto('/padres/hijos');
  await expect(page.getByLabel(/¿Cuánto es/)).toBeVisible();
});
