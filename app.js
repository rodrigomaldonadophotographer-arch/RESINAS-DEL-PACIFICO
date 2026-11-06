/* RESINAS DEL PACIFICO | BARRIO DIGITAL
   Catálogo público conectado a Supabase.
   Ficha de producto con color, tamaño y cantidad.
*/

const SUPABASE_URL = "https://epxbvaeantfeduhkolal.supabase.co";
const SUPABASE_KEY = "sb_publishable_jVso9pjnYOF-X6nBHDNEZg_IOurDgJ7";
const NEGOCIO_SLUG = "resinas-del-pacifico";
const WHATSAPP = "523221200860";
const CART_KEY = "resinas-pacifico-cart";

const productosOriginales = {
  "JI-001": { id: "ji-001", size: "Extra grande", dimensions: "35 cm × 120 cm" },
  "JI-002": { id: "ji-002", size: "Grande", dimensions: "44 cm × 92 cm" },
  "JI-003": { id: "ji-003", size: "Grande", dimensions: "30 cm × 83 cm" },
  "JI-011": { id: "ji-011", size: "Grande", dimensions: "62 cm × 52 cm" },
  "JA-002": { id: "ja-002", size: "Mediana", dimensions: "72 cm × 60 cm" },
  "JA-003": { id: "ja-003", size: "Grande", dimensions: "94 cm × 40 cm" },
  "CO-001": { id: "co-001", size: "Mediana", dimensions: "45 cm × 32 cm" },
  "CO-002": { id: "co-002", size: "Mediana", dimensions: "52 cm × 41 cm" },
  "OLL-001": { id: "oll-001", size: "Chica", dimensions: "30 cm × 45 cm" },
  "OLL-002": { id: "oll-002", size: "Chica", dimensions: "45 cm × 59 cm" },
  "OLL-010": { id: "oll-010", size: "Grande", dimensions: "43 cm × 59 cm" },
  "Proyecto": { id: "pergola", size: "Personalizada", dimensions: "Según espacio" }
};

const serviciosOriginales = {
  "Desarrollo de proyectos": "serv-proyecto",
  "Fabricación y moldes": "serv-moldes",
  "Asesoría de diseño": "serv-asesoria",
  "Instalación profesional": "serv-instalacion",
  "Reparación y mantenimiento": "serv-reparacion",
  "Pérgolas personalizadas": "serv-pergola"
};

let products = [];
let services = [];
let allItems = [];
let cart = {};
let productoEnFicha = null;
let ultimoFoco = null;

const grid = document.querySelector("#product-grid");
const serviceStack = document.querySelector("#service-stack");
const drawer = document.querySelector(".cart-drawer");
const backdrop = document.querySelector(".drawer-backdrop");
const cartItems = document.querySelector("#cart-items");
const emptyCart = document.querySelector("#empty-cart");
const quoteTotal = document.querySelector("#quote-total");
const form = document.querySelector("#quote-form");
const toast = document.querySelector("#toast");

function escapeHtml(value = "") {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[char]));
}

function precioTexto(precio) {
  if (precio === null || precio === undefined || precio === "") return "Cotizar";
  const numero = Number(precio);
  if (!Number.isFinite(numero)) return "Cotizar";
  return numero.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function obtenerFiltroActual() {
  return document.querySelector("[data-filter].active")?.dataset.filter || "todos";
}

function convertirProducto(registro) {
  const original = productosOriginales[registro.codigo] || {};
  let description = registro.descripcion || "";
  const size = original.size || "";
  const dimensions = original.dimensions || "";
  const prefijo = size && dimensions ? `${size} · ${dimensions}. ` : "";
  if (prefijo && description.startsWith(prefijo)) {
    description = description.slice(prefijo.length);
  }
  return {
    id: original.id || registro.id,
    uuid: registro.id,
    name: registro.nombre,
    code: registro.codigo || "",
    category: registro.categoria || "macetas",
    description,
    size,
    dimensions,
    image: registro.imagen_url || "",
    price: registro.precio,
    colors: Array.isArray(registro.colores) ? registro.colores.filter(Boolean) : [],
    sizes: Array.isArray(registro.tamanos) ? registro.tamanos.filter(Boolean) : [],
    available: registro.disponible !== false,
    type: "producto"
  };
}

function convertirServicio(registro) {
  return {
    id: serviciosOriginales[registro.nombre] || registro.id,
    uuid: registro.id,
    name: registro.nombre,
    code: "Servicio",
    category: "servicio",
    description: registro.descripcion || "",
    size: "",
    dimensions: "",
    image: registro.imagen_url || "",
    price: null,
    requiresQuote: registro.requiere_cotizacion !== false,
    type: "servicio"
  };
}

function mostrarCargando() {
  grid.innerHTML = '<p class="catalog-status">Cargando productos...</p>';
  serviceStack.innerHTML = '<p class="catalog-status">Cargando servicios...</p>';
}

function mostrarErrorCatalogo() {
  grid.innerHTML = '<p class="catalog-status">No pudimos cargar los productos. Comprueba tu conexión.</p><button class="button primary" id="retry-catalog" type="button">Reintentar</button>';
  serviceStack.innerHTML = '<p class="catalog-status">Los servicios no están disponibles temporalmente.</p>';
}

async function cargarCatalogo() {
  try {
    mostrarCargando();
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    const { data: negocio, error: errorNegocio } = await supabase
      .from("bd_negocios").select("id,nombre")
      .eq("slug", NEGOCIO_SLUG).eq("activo", true).single();
    if (errorNegocio || !negocio) throw new Error("No se pudo identificar el negocio.");

    const [respuestaProductos, respuestaServicios] = await Promise.all([
      supabase.from("bd_productos")
        .select("id,nombre,codigo,categoria,descripcion,precio,colores,tamanos,imagen_url,disponible")
        .eq("negocio_id", negocio.id).eq("activo", true)
        .order("fecha_registro", { ascending: true }),
      supabase.from("bd_servicios")
        .select("id,nombre,descripcion,imagen_url,requiere_cotizacion")
        .eq("negocio_id", negocio.id).eq("activo", true)
        .order("fecha_registro", { ascending: true })
    ]);
    if (respuestaProductos.error) throw respuestaProductos.error;
    if (respuestaServicios.error) throw respuestaServicios.error;

    products = (respuestaProductos.data || []).map(convertirProducto);
    services = (respuestaServicios.data || []).map(convertirServicio);
    allItems = [...products, ...services];
    renderProducts(obtenerFiltroActual());
    renderServices();
    renderCart();
    console.info("Barrio Digital: catálogo conectado", {
      productos: products.length, servicios: services.length
    });
  } catch (error) {
    console.error("Error al cargar catálogo:", error);
    mostrarErrorCatalogo();
  }
}

function renderProducts(filter = "todos") {
  if (!products.length) {
    grid.innerHTML = '<p class="catalog-status">No hay productos publicados.</p>';
    return;
  }
  grid.innerHTML = products.map(product => {
    const oculto = filter !== "todos" && product.category !== filter;
    const etiqueta = product.category === "proyectos" ? "Proyecto a medida" : "Macetas y accesorios";
    const detalles = [product.size, product.dimensions].filter(Boolean);
    return `
      <article class="product-card reveal" data-category="${escapeHtml(product.category)}" ${oculto ? "hidden" : ""}>
        <div class="product-media">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" width="500" height="500">
          <span class="product-badge">${escapeHtml(product.code)}</span>
        </div>
        <div class="product-body">
          <span class="product-kicker">${etiqueta}</span>
          <h3>${escapeHtml(product.name)}</h3>
          <p class="product-description">${escapeHtml(product.description)}</p>
          <div class="product-meta">${detalles.map(valor => `<span>${escapeHtml(valor)}</span>`).join("")}</div>
          <div class="product-footer">
            <span class="quote-price"><small>Precio</small><strong>${escapeHtml(precioTexto(product.price))}</strong></span>
            <button class="add-button" type="button" data-add="${escapeHtml(product.id)}"
              aria-label="Elegir características de ${escapeHtml(product.name)}"
              ${!product.available ? "disabled" : ""}>${product.available ? "+" : "×"}</button>
          </div>
        </div>
      </article>`;
  }).join("");
  observeReveals();
}

function renderServices() {
  if (!services.length) {
    serviceStack.innerHTML = '<p class="catalog-status">No hay servicios publicados.</p>';
    return;
  }
  serviceStack.innerHTML = services.map((service, index) => `
    <article class="service-card" style="--i:${index}">
      <img src="${escapeHtml(service.image)}" alt="" loading="lazy" width="180" height="140">
      <div><span class="service-number">${String(index + 1).padStart(2, "0")} · Servicio</span>
        <h3>${escapeHtml(service.name)}</h3><p>${escapeHtml(service.description)}</p></div>
      <button type="button" data-add="${escapeHtml(service.id)}" aria-label="Agregar ${escapeHtml(service.name)}">+</button>
    </article>`).join("");
}

/* FICHA DE PRODUCTO. Se crea desde JS para no modificar index.html ni styles.css. */
function crearFicha() {
  if (document.querySelector("#bd-ficha")) return;
  const estilo = document.createElement("style");
  estilo.textContent = `
    #bd-ficha[hidden] { display:none !important; }
    #bd-ficha { position:fixed; inset:0; z-index:10050; display:grid; place-items:center;
      padding:18px; background:rgba(4,24,40,.76); overflow-y:auto; }
    #bd-ficha .bd-ficha-panel { width:min(100%,540px); max-height:calc(100dvh - 36px);
      overflow-y:auto; background:#fff; color:#082e49; border-radius:18px;
      box-shadow:0 20px 65px rgba(0,0,0,.35); position:relative; }
    #bd-ficha .bd-ficha-imagen { display:block; width:100%; height:210px; object-fit:cover; }
    #bd-ficha .bd-ficha-cuerpo { padding:22px; }
    #bd-ficha h2 { margin:0 35px 8px 0; font-size:26px; color:#082e49; }
    #bd-ficha p { margin:8px 0 16px; line-height:1.55; color:#4c6474; }
    #bd-ficha .bd-ficha-cerrar { position:absolute; top:12px; right:12px; border:0;
      border-radius:50%; width:40px; height:40px; background:#fff; color:#082e49;
      font-size:26px; cursor:pointer; box-shadow:0 2px 10px #0003; }
    #bd-ficha label { display:block; margin:15px 0 6px; font-weight:700; font-size:14px; }
    #bd-ficha select { width:100%; padding:13px; border:1px solid #bed9e6;
      border-radius:9px; background:#fff; color:#082e49; font:inherit; }
    #bd-ficha .bd-ficha-cantidad { display:flex; align-items:center; gap:16px; }
    #bd-ficha .bd-ficha-cantidad button { width:40px; height:40px; border:1px solid #bed9e6;
      border-radius:9px; background:#f3f9fc; color:#082e49; font-size:23px; cursor:pointer; }
    #bd-ficha .bd-ficha-cantidad strong { min-width:30px; text-align:center; font-size:20px; }
    #bd-ficha .bd-ficha-agregar { display:block; width:100%; margin-top:20px;
      padding:15px; border:0; border-radius:10px; background:#062f50;
      color:#fff; font-weight:700; font-size:15px; cursor:pointer; }
    #bd-ficha .bd-ficha-precio { color:#062f50; font-weight:700; margin-top:12px; }
    #bd-ficha .bd-ficha-referencia { font-size:12px; color:#557082; }
    body.bd-ficha-abierta { overflow:hidden; }
  `;
  document.head.appendChild(estilo);
  const modal = document.createElement("div");
  modal.id = "bd-ficha";
  modal.hidden = true;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "bd-ficha-titulo");
  modal.innerHTML = `
    <div class="bd-ficha-panel">
      <button type="button" class="bd-ficha-cerrar" data-cerrar-ficha aria-label="Cerrar ficha">×</button>
      <img class="bd-ficha-imagen" id="bd-ficha-imagen" alt="">
      <div class="bd-ficha-cuerpo">
        <h2 id="bd-ficha-titulo"></h2>
        <p id="bd-ficha-descripcion"></p>
        <div class="bd-ficha-referencia" id="bd-ficha-referencia"></div>
        <div class="bd-ficha-precio" id="bd-ficha-precio"></div>
        <form id="bd-ficha-form">
          <div id="bd-ficha-colores" hidden>
            <label for="bd-ficha-color">Elige un color</label>
            <select id="bd-ficha-color" required></select>
          </div>
          <div id="bd-ficha-tamanos" hidden>
            <label for="bd-ficha-tamano">Elige un tamaño</label>
            <select id="bd-ficha-tamano" required></select>
          </div>
          <label>Cantidad</label>
          <div class="bd-ficha-cantidad">
            <button type="button" data-cantidad="-1" aria-label="Restar cantidad">−</button>
            <strong id="bd-ficha-numero">1</strong>
            <button type="button" data-cantidad="1" aria-label="Sumar cantidad">+</button>
          </div>
          <button class="bd-ficha-agregar" type="submit">AGREGAR AL CARRITO</button>
        </form>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener("click", event => {
    if (event.target === modal || event.target.closest("[data-cerrar-ficha]")) cerrarFicha();
    const control = event.target.closest("[data-cantidad]");
    if (control) {
      const numero = document.querySelector("#bd-ficha-numero");
      numero.textContent = Math.max(1, Math.min(999, Number(numero.textContent) + Number(control.dataset.cantidad)));
    }
  });
  modal.querySelector("#bd-ficha-form").addEventListener("submit", event => {
    event.preventDefault();
    if (!productoEnFicha) return;
    const color = productoEnFicha.colors.length ? modal.querySelector("#bd-ficha-color").value : "";
    const tamano = productoEnFicha.sizes.length ? modal.querySelector("#bd-ficha-tamano").value : "";
    const cantidad = Number(modal.querySelector("#bd-ficha-numero").textContent);
    if (productoEnFicha.colors.length && !productoEnFicha.colors.includes(color)) return;
    if (productoEnFicha.sizes.length && !productoEnFicha.sizes.includes(tamano)) return;
    agregarSeleccion(productoEnFicha, color, tamano, cantidad);
    cerrarFicha();
  });
  modal.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const focos = [...modal.querySelectorAll("button:not([disabled]),select:not([disabled])")]
      .filter(el => el.offsetParent !== null);
    if (!focos.length) return;
    if (event.shiftKey && document.activeElement === focos[0]) {
      event.preventDefault(); focos[focos.length - 1].focus();
    } else if (!event.shiftKey && document.activeElement === focos[focos.length - 1]) {
      event.preventDefault(); focos[0].focus();
    }
  });
}

function abrirFicha(id) {
  const producto = products.find(item => item.id === id);
  if (!producto || !producto.available) {
    showToast("Producto no disponible");
    return;
  }
  crearFicha();
  productoEnFicha = producto;
  ultimoFoco = document.activeElement;
  const modal = document.querySelector("#bd-ficha");
  modal.querySelector("#bd-ficha-imagen").src = producto.image;
  modal.querySelector("#bd-ficha-imagen").alt = producto.name;
  modal.querySelector("#bd-ficha-titulo").textContent = producto.name;
  modal.querySelector("#bd-ficha-descripcion").textContent = producto.description;
  modal.querySelector("#bd-ficha-referencia").textContent =
    [producto.code, producto.size, producto.dimensions].filter(Boolean).join(" · ");
  modal.querySelector("#bd-ficha-precio").textContent = `Precio: ${precioTexto(producto.price)}`;
  const colores = modal.querySelector("#bd-ficha-colores");
  const tamanos = modal.querySelector("#bd-ficha-tamanos");
  colores.hidden = !producto.colors.length;
  tamanos.hidden = !producto.sizes.length;
  modal.querySelector("#bd-ficha-color").innerHTML = producto.colors.map(valor =>
    `<option value="${escapeHtml(valor)}">${escapeHtml(valor)}</option>`).join("");
  modal.querySelector("#bd-ficha-tamano").innerHTML = producto.sizes.map(valor =>
    `<option value="${escapeHtml(valor)}">${escapeHtml(valor)}</option>`).join("");
  modal.querySelector("#bd-ficha-numero").textContent = "1";
  modal.hidden = false;
  document.body.classList.add("bd-ficha-abierta");
  modal.querySelector("[data-cerrar-ficha]").focus();
}

function cerrarFicha() {
  const modal = document.querySelector("#bd-ficha");
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  document.body.classList.remove("bd-ficha-abierta");
  productoEnFicha = null;
  if (ultimoFoco?.isConnected) ultimoFoco.focus();
}

/* CARRITO: cada combinación color/tamaño tiene su propia clave. */
function claveSeleccion(id, color = "", tamano = "") {
  return JSON.stringify([id, color, tamano]);
}

function recuperarCarrito() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
    if (!guardado || typeof guardado !== "object" || Array.isArray(guardado)) return;
    for (const [clave, valor] of Object.entries(guardado)) {
      if (typeof valor === "number" && Number.isInteger(valor) && valor > 0) {
        // Compatibilidad con el carrito anterior, que solo guardaba cantidades.
        cart[claveSeleccion(clave)] = { id: clave, color: "", tamano: "", cantidad: valor };
      } else if (valor && typeof valor === "object") {
        const id = String(valor.id || "");
        const color = String(valor.color || "");
        const tamano = String(valor.tamano || "");
        const cantidad = Number(valor.cantidad);
        if (id && Number.isInteger(cantidad) && cantidad > 0) {
          const key = claveSeleccion(id, color, tamano);
          cart[key] = { id, color, tamano, cantidad };
        }
      }
    }
  } catch (error) {
    console.warn("No se pudo recuperar el carrito", error);
  }
}
recuperarCarrito();

function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.warn("No se pudo guardar el carrito", error);
  }
  renderCart();
}

function agregarSeleccion(item, color = "", tamano = "", cantidad = 1) {
  if (!item || (item.type === "producto" && !item.available)) {
    showToast("Artículo no disponible");
    return;
  }
  const clave = claveSeleccion(item.id, color, tamano);
  const anterior = Number(cart[clave]?.cantidad) || 0;
  cart[clave] = { id: item.id, color, tamano, cantidad: anterior + cantidad };
  saveCart();
  showToast("Agregado a tu solicitud");
}

function addItem(id) {
  const item = allItems.find(candidate => candidate.id === id);
  if (!item) return showToast("Artículo no disponible");
  if (item.type === "producto") abrirFicha(id);
  else agregarSeleccion(item);
}

function updateItem(clave, delta) {
  if (!Object.prototype.hasOwnProperty.call(cart, clave)) return;
  const siguiente = Number(cart[clave].cantidad) + delta;
  if (siguiente <= 0) delete cart[clave];
  else cart[clave].cantidad = siguiente;
  saveCart();
}

function obtenerEntradasValidas() {
  return Object.entries(cart).map(([clave, seleccion]) => ({
    clave,
    item: allItems.find(candidate => candidate.id === seleccion.id),
    color: seleccion.color || "",
    tamano: seleccion.tamano || "",
    cantidad: Number(seleccion.cantidad)
  })).filter(entrada => entrada.item && Number.isInteger(entrada.cantidad) &&
    entrada.cantidad > 0 && (entrada.item.type !== "producto" || entrada.item.available));
}

function renderCart() {
  const entries = obtenerEntradasValidas();
  const count = entries.reduce((sum, entrada) => sum + entrada.cantidad, 0);
  document.querySelectorAll(".cart-count").forEach(el => { el.textContent = count; });
  emptyCart.hidden = entries.length > 0;
  quoteTotal.hidden = entries.length === 0;
  form.hidden = entries.length === 0;
  cartItems.innerHTML = entries.map(({ clave, item, color, tamano, cantidad }) => {
    const precio = item.price == null ? "Precio por cotizar" : precioTexto(item.price);
    const opciones = [color && `Color: ${color}`, tamano && `Tamaño: ${tamano}`].filter(Boolean);
    return `
      <div class="cart-item">
        <img src="${escapeHtml(item.image)}" alt="" width="72" height="72">
        <div>
          <h3>${escapeHtml(item.name)}</h3>
          <small>${escapeHtml(item.code)} · ${escapeHtml(precio)}</small>
          ${opciones.length ? `<small style="display:block;line-height:1.5">${opciones.map(escapeHtml).join("<br>")}</small>` : ""}
          <button class="remove-item" type="button" data-remove="${escapeHtml(clave)}">Eliminar</button>
        </div>
        <div class="qty">
          <button type="button" data-qty="${escapeHtml(clave)}" data-delta="-1" aria-label="Restar uno">−</button>
          <strong>${cantidad}</strong>
          <button type="button" data-qty="${escapeHtml(clave)}" data-delta="1" aria-label="Agregar uno">+</button>
        </div>
      </div>`;
  }).join("");
  actualizarTotal(entries);
}

function actualizarTotal(entries) {
  const tieneCotizacion = entries.some(({ item }) => item.price == null);
  const total = entries.reduce((suma, { item, cantidad }) =>
    suma + (item.price == null ? 0 : Number(item.price) * cantidad), 0);
  const totalElemento = quoteTotal.querySelector("strong");
  if (!entries.length) totalElemento.textContent = "Sujeto a cotización";
  else if (tieneCotizacion) totalElemento.textContent = total > 0
    ? `${precioTexto(total)} + artículos por cotizar` : "Sujeto a cotización";
  else totalElemento.textContent = precioTexto(total);
}

function openCart() {
  backdrop.hidden = false;
  requestAnimationFrame(() => drawer.classList.add("open"));
  drawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
  drawer.querySelector(".icon-button").focus();
}

function closeCart() {
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("drawer-open");
  setTimeout(() => {
    if (!drawer.classList.contains("open")) backdrop.hidden = true;
  }, 350);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function observeReveals() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".reveal").forEach(el => el.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal:not(.visible)").forEach(el => observer.observe(el));
}

document.addEventListener("click", event => {
  if (event.target.closest("#retry-catalog")) {
    cargarCatalogo();
    return;
  }
  const add = event.target.closest("[data-add]");
  const remove = event.target.closest("[data-remove]");
  const qty = event.target.closest("[data-qty]");
  const open = event.target.closest("[data-open-cart]");
  const close = event.target.closest("[data-close-cart]");
  if (add) addItem(add.dataset.add);
  else if (remove) {
    delete cart[remove.dataset.remove];
    saveCart();
  } else if (qty) updateItem(qty.dataset.qty, Number(qty.dataset.delta));
  else if (open) openCart();
  else if (close) closeCart();
});

document.querySelectorAll("[data-filter]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach(el => el.classList.remove("active"));
    button.classList.add("active");
    const filter = button.dataset.filter;
    document.querySelectorAll(".product-card").forEach(card => {
      card.hidden = filter !== "todos" && card.dataset.category !== filter;
    });
  });
});

document.querySelectorAll('input[name="delivery"]').forEach(input => {
  input.addEventListener("change", () => {
    const addressField = document.querySelector("#address-field");
    const delivery = document.querySelector('input[name="delivery"]:checked')?.value;
    const needsAddress = delivery === "Entrega a domicilio";
    addressField.hidden = !needsAddress;
    addressField.querySelector("input").required = needsAddress;
  });
});

form.addEventListener("submit", event => {
  event.preventDefault();
  const entries = obtenerEntradasValidas();
  if (!entries.length) return showToast("Agrega un producto o servicio");
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const lines = entries.map(({ item, color, tamano, cantidad }) => {
    const precio = item.price == null ? "Por cotizar" : precioTexto(item.price);
    const opciones = [color && `Color: ${color}`, tamano && `Tamaño: ${tamano}`].filter(Boolean);
    return `• ${cantidad} × ${item.name}${item.code ? ` (${item.code})` : ""} — ${precio}` +
      (opciones.length ? `\n  ${opciones.join(" | ")}` : "");
  });
  const address = data.get("address");
  const message = [
    "Hola, Resinas del Pacífico.",
    "Deseo realizar la siguiente solicitud:",
    "",
    ...lines,
    "",
    `Nombre: ${data.get("name")}`,
    `Teléfono: ${data.get("phone")}`,
    `Entrega: ${data.get("delivery")}`,
    address ? `Dirección: ${address}` : "",
    `Pago preferido: ${data.get("payment")}`,
    data.get("notes") ? `Observaciones: ${data.get("notes")}` : "",
    "",
    "Favor de confirmar disponibilidad, precios y condiciones de entrega."
  ].filter(Boolean).join("\n");
  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (document.querySelector("#bd-ficha")?.hidden === false) cerrarFicha();
    else if (drawer.classList.contains("open")) closeCart();
  }
});

crearFicha();
cargarCatalogo();
observeReveals();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(error => {
      console.warn("Service Worker:", error);
    });
  });
}
