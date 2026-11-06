
/* ============================================
   RESINAS DEL PACIFICO
   CATALOGO PUBLICO - BARRIO DIGITAL
   Conexion Supabase
   ============================================ */

const SUPABASE_URL =
  "https://epxbvaeantfeduhkolal.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_jVso9pjnYOF-X6nBHDNEZg_IOurDgJ7";

const NEGOCIO_SLUG = "resinas-del-pacifico";

const WHATSAPP = "523221200860";

const CART_KEY = "resinas-pacifico-cart";

/* ============================================
   REFERENCIAS DE PRODUCTOS ORIGINALES
   ============================================ */

const productosOriginales = {
  "JI-001": {
    id: "ji-001",
    size: "Extra grande",
    dimensions: "35 cm × 120 cm"
  },
  "JI-002": {
    id: "ji-002",
    size: "Grande",
    dimensions: "44 cm × 92 cm"
  },
  "JI-003": {
    id: "ji-003",
    size: "Grande",
    dimensions: "30 cm × 83 cm"
  },
  "JI-011": {
    id: "ji-011",
    size: "Grande",
    dimensions: "62 cm × 52 cm"
  },
  "JA-002": {
    id: "ja-002",
    size: "Mediana",
    dimensions: "72 cm × 60 cm"
  },
  "JA-003": {
    id: "ja-003",
    size: "Grande",
    dimensions: "94 cm × 40 cm"
  },
  "CO-001": {
    id: "co-001",
    size: "Mediana",
    dimensions: "45 cm × 32 cm"
  },
  "CO-002": {
    id: "co-002",
    size: "Mediana",
    dimensions: "52 cm × 41 cm"
  },
  "OLL-001": {
    id: "oll-001",
    size: "Chica",
    dimensions: "30 cm × 45 cm"
  },
  "OLL-002": {
    id: "oll-002",
    size: "Chica",
    dimensions: "45 cm × 59 cm"
  },
  "OLL-010": {
    id: "oll-010",
    size: "Grande",
    dimensions: "43 cm × 59 cm"
  },
  "Proyecto": {
    id: "pergola",
    size: "Personalizada",
    dimensions: "Según espacio"
  }
};

const serviciosOriginales = {
  "Desarrollo de proyectos": "serv-proyecto",
  "Fabricación y moldes": "serv-moldes",
  "Asesoría de diseño": "serv-asesoria",
  "Instalación profesional": "serv-instalacion",
  "Reparación y mantenimiento": "serv-reparacion",
  "Pérgolas personalizadas": "serv-pergola"
};

/* ============================================
   VARIABLES
   ============================================ */

let products = [];
let services = [];
let allItems = [];

let cart = {};

try {
  const guardado = JSON.parse(
    localStorage.getItem(CART_KEY) || "{}"
  );

  if (
    guardado &&
    typeof guardado === "object" &&
    !Array.isArray(guardado)
  ) {
    cart = guardado;
  }
} catch (error) {
  console.warn("No se pudo leer el carrito", error);
}

const grid = document.querySelector("#product-grid");
const serviceStack = document.querySelector("#service-stack");
const drawer = document.querySelector(".cart-drawer");
const backdrop = document.querySelector(".drawer-backdrop");
const cartItems = document.querySelector("#cart-items");
const emptyCart = document.querySelector("#empty-cart");
const quoteTotal = document.querySelector("#quote-total");
const form = document.querySelector("#quote-form");
const toast = document.querySelector("#toast");

/* ============================================
   SEGURIDAD DE TEXTO
   ============================================ */

function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>'"]/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[char])
  );
}

function precioTexto(precio) {
  if (
    precio === null ||
    precio === undefined ||
    precio === ""
  ) {
    return "Cotizar";
  }

  const numero = Number(precio);

  if (!Number.isFinite(numero)) {
    return "Cotizar";
  }

  return numero.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN"
  });
}

/* ============================================
   CONEXION CON SUPABASE
   ============================================ */

async function cargarCatalogo() {
  try {
    mostrarCargando();

    const { createClient } = await import(
      "https://esm.sh/@supabase/supabase-js@2"
    );

    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );

    // Identificar negocio activo.

    const {
      data: negocio,
      error: errorNegocio
    } = await supabase
      .from("bd_negocios")
      .select("id, nombre")
      .eq("slug", NEGOCIO_SLUG)
      .eq("activo", true)
      .single();

    if (errorNegocio || !negocio) {
      throw new Error(
        "No se pudo identificar el negocio."
      );
    }

    // Obtener productos y servicios.

    const [
      resultadoProductos,
      resultadoServicios
    ] = await Promise.all([
      supabase
        .from("bd_productos")
        .select(
          "id,nombre,codigo,categoria,descripcion,precio,colores,tamanos,imagen_url,disponible"
        )
        .eq("negocio_id", negocio.id)
        .eq("activo", true)
        .order("fecha_registro", {
          ascending: true
        }),

      supabase
        .from("bd_servicios")
        .select(
          "id,nombre,descripcion,imagen_url,requiere_cotizacion"
        )
        .eq("negocio_id", negocio.id)
        .eq("activo", true)
        .order("fecha_registro", {
          ascending: true
        })
    ]);

    if (resultadoProductos.error) {
      throw resultadoProductos.error;
    }

    if (resultadoServicios.error) {
      throw resultadoServicios.error;
    }

    products = (resultadoProductos.data || []).map(
      convertirProducto
    );

    services = (resultadoServicios.data || []).map(
      convertirServicio
    );

    allItems = [
      ...products,
      ...services
    ];

    renderProducts(obtenerFiltroActual());
    renderServices();
    renderCart();

    console.info(
      "Barrio Digital: catálogo conectado",
      {
        productos: products.length,
        servicios: services.length
      }
    );

  } catch (error) {
    console.error(
      "Error al cargar catálogo:",
      error
    );

    mostrarErrorCatalogo();
  }
}

/* ============================================
   CONVERTIR PRODUCTOS DE SUPABASE
   ============================================ */

function convertirProducto(registro) {
  const original =
    productosOriginales[registro.codigo] || {};

  let descripcion = registro.descripcion || "";

  let size = original.size || "";
  let dimensions = original.dimensions || "";

  // Las medidas iniciales fueron guardadas
  // dentro de la descripcion en Supabase.
  // Se separan para conservar el diseño.

  const prefijo = size && dimensions
    ? `${size} · ${dimensions}. `
    : "";

  if (
    prefijo &&
    descripcion.startsWith(prefijo)
  ) {
    descripcion = descripcion.slice(
      prefijo.length
    );
  }

  return {
    id: original.id || registro.id,
    uuid: registro.id,
    name: registro.nombre,
    code: registro.codigo || "",
    category: registro.categoria || "macetas",
    description: descripcion,
    size,
    dimensions,
    image: registro.imagen_url || "",
    price: registro.precio,
    colors: registro.colores || [],
    sizes: registro.tamanos || [],
    available: registro.disponible !== false,
    type: "producto"
  };
}

function convertirServicio(registro) {
  return {
    id:
      serviciosOriginales[registro.nombre] ||
      registro.id,
    uuid: registro.id,
    name: registro.nombre,
    code: "Servicio",
    category: "servicio",
    description: registro.descripcion || "",
    size: "",
    dimensions: "",
    image: registro.imagen_url || "",
    price: null,
    requiresQuote:
      registro.requiere_cotizacion !== false,
    type: "servicio"
  };
}

/* ============================================
   ESTADOS DE CARGA
   ============================================ */

function mostrarCargando() {
  grid.innerHTML = `
    <p class="catalog-status">
      Cargando productos...
    </p>
  `;

  serviceStack.innerHTML = `
    <p class="catalog-status">
      Cargando servicios...
    </p>
  `;
}

function mostrarErrorCatalogo() {
  grid.innerHTML = `
    <p class="catalog-status">
      No pudimos cargar los productos.
      Comprueba tu conexión e inténtalo
      nuevamente.
    </p>
    <button
      class="button primary"
      type="button"
      id="retry-catalog"
    >
      Reintentar
    </button>
  `;

  serviceStack.innerHTML = `
    <p class="catalog-status">
      Los servicios no están disponibles
      temporalmente.
    </p>
  `;
}

/* ============================================
   PRODUCTOS
   ============================================ */

function obtenerFiltroActual() {
  return document.querySelector(
    "[data-filter].active"
  )?.dataset.filter || "todos";
}

function renderProducts(filter = "todos") {
  if (!products.length) {
    grid.innerHTML = `
      <p class="catalog-status">
        No hay productos publicados.
      </p>
    `;
    return;
  }

  grid.innerHTML = products.map(
    (product, index) => {

      const oculto =
        filter !== "todos" &&
        product.category !== filter;

      const precio = precioTexto(product.price);

      const etiqueta = product.category === "proyectos"
        ? "Proyecto a medida"
        : "Macetas y accesorios";

      return `
        <article
          class="product-card reveal"
          data-category="${escapeHtml(product.category)}"
          ${oculto ? "hidden" : ""}
        >

          <div class="product-media">
            <img
              src="${escapeHtml(product.image)}"
              alt="${escapeHtml(product.name)}"
              loading="lazy"
              width="500"
              height="500"
            >

            <span class="product-badge">
              ${escapeHtml(product.code)}
            </span>
          </div>

          <div class="product-body">

            <span class="product-kicker">
              ${etiqueta}
            </span>

            <h3>${escapeHtml(product.name)}</h3>

            <p class="product-description">
              ${escapeHtml(product.description)}
            </p>

            <div class="product-meta">
              <span>${escapeHtml(product.size)}</span>
              <span>${escapeHtml(product.dimensions)}</span>
            </div>

            <div class="product-footer">

              <span class="quote-price">
                <small>Precio</small>
                <strong>${escapeHtml(precio)}</strong>
              </span>

              <button
                class="add-button ${cart[product.id] ? "added" : ""}"
                type="button"
                data-add="${escapeHtml(product.id)}"
                aria-label="Agregar ${escapeHtml(product.name)}"
                ${!product.available ? "disabled" : ""}
              >
                ${product.available ? "+" : "×"}
              </button>

            </div>

          </div>
        </article>
      `;
    }
  ).join("");

  observeReveals();
}

/* ============================================
   SERVICIOS
   ============================================ */

function renderServices() {
  if (!services.length) {
    serviceStack.innerHTML = `
      <p class="catalog-status">
        No hay servicios publicados.
      </p>
    `;
    return;
  }

  serviceStack.innerHTML = services.map(
    (service, index) => `
      <article
        class="service-card"
        style="--i:${index}"
      >

        <img
          src="${escapeHtml(service.image)}"
          alt=""
          loading="lazy"
          width="180"
          height="140"
        >

        <div>
          <span class="service-number">
            ${String(index + 1).padStart(2, "0")}
            · Servicio
          </span>

          <h3>${escapeHtml(service.name)}</h3>

          <p>${escapeHtml(service.description)}</p>
        </div>

        <button
          type="button"
          data-add="${escapeHtml(service.id)}"
          aria-label="Agregar ${escapeHtml(service.name)}"
        >
          +
        </button>

      </article>
    `
  ).join("");
}

/* ============================================
   CARRITO
   ============================================ */

function saveCart() {
  try {
    localStorage.setItem(
      CART_KEY,
      JSON.stringify(cart)
    );
  } catch (error) {
    console.warn(
      "No se pudo guardar el carrito",
      error
    );
  }

  renderCart();

  document.querySelectorAll(
    "[data-add]"
  ).forEach(button => {
    button.classList.toggle(
      "added",
      Boolean(cart[button.dataset.add])
    );
  });
}

function addItem(id) {
  const item = allItems.find(
    candidate => candidate.id === id
  );

  if (!item) {
    showToast("Artículo no disponible");
    return;
  }

  if (
    item.type === "producto" &&
    !item.available
  ) {
    showToast("Producto no disponible");
    return;
  }

  cart[id] = (Number(cart[id]) || 0) + 1;

  saveCart();

  showToast("Agregado a tu solicitud");
}

function updateItem(id, delta) {
  const actual = Number(cart[id]) || 0;

  const siguiente = actual + delta;

  if (siguiente <= 0) {
    delete cart[id];
  } else {
    cart[id] = siguiente;
  }

  saveCart();
}

function obtenerEntradasValidas() {
  return Object.entries(cart)
    .map(([id, cantidad]) => ({
      item: allItems.find(
        candidato => candidato.id === id
      ),
      cantidad: Number(cantidad)
    }))
    .filter(entrada =>
      entrada.item &&
      Number.isInteger(entrada.cantidad) &&
      entrada.cantidad > 0 &&
      (
        entrada.item.type !== "producto" ||
        entrada.item.available
      )
    );
}

function renderCart() {
  const entries = obtenerEntradasValidas();

  const count = entries.reduce(
    (sum, entrada) =>
      sum + entrada.cantidad,
    0
  );

  document.querySelectorAll(
    ".cart-count"
  ).forEach(elemento => {
    elemento.textContent = count;
  });

  emptyCart.hidden = entries.length > 0;

  quoteTotal.hidden = entries.length === 0;

  form.hidden = entries.length === 0;

  cartItems.innerHTML = entries.map(
    ({ item, cantidad }) => {

      const precio = item.price === null
        ? "Precio por cotizar"
        : precioTexto(item.price);

      return `
        <div class="cart-item">

          <img
            src="${escapeHtml(item.image)}"
            alt=""
            width="72"
            height="72"
          >

          <div>
            <h3>${escapeHtml(item.name)}</h3>

            <small>
              ${escapeHtml(item.code)}
              · ${escapeHtml(precio)}
            </small>

            <button
              class="remove-item"
              type="button"
              data-remove="${escapeHtml(item.id)}"
            >
              Eliminar
            </button>
          </div>

          <div class="qty">

            <button
              type="button"
              data-qty="${escapeHtml(item.id)}"
              data-delta="-1"
              aria-label="Restar uno"
            >−</button>

            <strong>${cantidad}</strong>

            <button
              type="button"
              data-qty="${escapeHtml(item.id)}"
              data-delta="1"
              aria-label="Agregar uno"
            >+</button>

          </div>

        </div>
      `;
    }
  ).join("");

  actualizarTotal(entries);
}

function actualizarTotal(entries) {
  const tieneCotizacion = entries.some(
    ({ item }) =>
      item.price === null ||
      item.price === undefined
  );

  const total = entries.reduce(
    (suma, { item, cantidad }) => {
      if (item.price === null) {
        return suma;
      }

      return suma + Number(item.price) * cantidad;
    },
    0
  );

  const totalElemento = quoteTotal.querySelector(
    "strong"
  );

  if (!entries.length) {
    totalElemento.textContent =
      "Sujeto a cotización";
    return;
  }

  if (tieneCotizacion) {
    totalElemento.textContent =
      total > 0
        ? `${precioTexto(total)} + artículos por cotizar`
        : "Sujeto a cotización";
  } else {
    totalElemento.textContent =
      precioTexto(total);
  }
}

/* ============================================
   ABRIR Y CERRAR CARRITO
   ============================================ */

function openCart() {
  backdrop.hidden = false;

  requestAnimationFrame(() => {
    drawer.classList.add("open");
  });

  drawer.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "drawer-open"
  );

  drawer.querySelector(
    ".icon-button"
  ).focus();
}

function closeCart() {
  drawer.classList.remove("open");

  drawer.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "drawer-open"
  );

  setTimeout(() => {
    if (!drawer.classList.contains("open")) {
      backdrop.hidden = true;
    }
  }, 350);
}

/* ============================================
   NOTIFICACIONES
   ============================================ */

function showToast(message) {
  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

/* ============================================
   ANIMACIONES
   ============================================ */

function observeReveals() {
  if (
    matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
  ) {
    document.querySelectorAll(
      ".reveal"
    ).forEach(elemento => {
      elemento.classList.add("visible");
    });

    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(
            "visible"
          );

          observer.unobserve(
            entry.target
          );
        }
      });
    },
    {
      threshold: 0.12
    }
  );

  document.querySelectorAll(
    ".reveal:not(.visible)"
  ).forEach(elemento => {
    observer.observe(elemento);
  });
}

/* ============================================
   EVENTOS DE BOTONES
   ============================================ */

document.addEventListener(
  "click",
  event => {

    const reintentar = event.target.closest(
      "#retry-catalog"
    );

    if (reintentar) {
      cargarCatalogo();
      return;
    }

    const add = event.target.closest(
      "[data-add]"
    );

    const remove = event.target.closest(
      "[data-remove]"
    );

    const qty = event.target.closest(
      "[data-qty]"
    );

    const open = event.target.closest(
      "[data-open-cart]"
    );

    const close = event.target.closest(
      "[data-close-cart]"
    );

    if (add) {
      addItem(add.dataset.add);
    }

    if (remove) {
      delete cart[remove.dataset.remove];
      saveCart();
    }

    if (qty) {
      updateItem(
        qty.dataset.qty,
        Number(qty.dataset.delta)
      );
    }

    if (open) {
      openCart();
    }

    if (close) {
      closeCart();
    }
  }
);

/* ============================================
   FILTROS
   ============================================ */

document.querySelectorAll(
  "[data-filter]"
).forEach(button => {

  button.addEventListener(
    "click",
    () => {

      document.querySelectorAll(
        "[data-filter]"
      ).forEach(item => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      const filter = button.dataset.filter;

      document.querySelectorAll(
        ".product-card"
      ).forEach(card => {
        card.hidden =
          filter !== "todos" &&
          card.dataset.category !== filter;
      });
    }
  );
});

/* ============================================
   TIPO DE ENTREGA
   ============================================ */

document.querySelectorAll(
  'input[name="delivery"]'
).forEach(input => {

  input.addEventListener(
    "change",
    () => {

      const addressField =
        document.querySelector(
          "#address-field"
        );

      const delivery = document.querySelector(
        'input[name="delivery"]:checked'
      )?.value;

      const needsAddress =
        delivery === "Entrega a domicilio";

      addressField.hidden = !needsAddress;

      addressField.querySelector(
        "input"
      ).required = needsAddress;
    }
  );
});

/* ============================================
   ENVIAR SOLICITUD POR WHATSAPP
   ============================================ */

form.addEventListener(
  "submit",
  event => {

    event.preventDefault();

    const entries = obtenerEntradasValidas();

    if (!entries.length) {
      showToast(
        "Agrega un producto o servicio"
      );
      return;
    }

    if (!form.reportValidity()) {
      return;
    }

    const data = new FormData(form);

    const lines = entries.map(
      ({ item, cantidad }) => {

        const precio = item.price === null
          ? "Por cotizar"
          : precioTexto(item.price);

        return (
          `• ${cantidad} × ${item.name}` +
          `${item.code ? ` (${item.code})` : ""}` +
          ` — ${precio}`
        );
      }
    );

    const delivery = data.get("delivery");

    const address = data.get("address");

    const message = [
      "Hola, Resinas del Pacífico.",
      "Deseo realizar la siguiente solicitud:",
      "",
      ...lines,
      "",
      `Nombre: ${data.get("name")}`,
      `Teléfono: ${data.get("phone")}`,
      `Entrega: ${delivery}`,
      address
        ? `Dirección: ${address}`
        : "",
      `Pago preferido: ${data.get("payment")}`,
      data.get("notes")
        ? `Observaciones: ${data.get("notes")}`
        : "",
      "",
      "Favor de confirmar disponibilidad, precios y condiciones de entrega."
    ].filter(Boolean).join("\n");

    const url =
      `https://wa.me/${WHATSAPP}` +
      `?text=${encodeURIComponent(message)}`;

    window.open(
      url,
      "_blank",
      "noopener"
    );
  }
);

/* ============================================
   TECLA ESCAPE
   ============================================ */

document.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "Escape" &&
      drawer.classList.contains("open")
    ) {
      closeCart();
    }
  }
);

/* ============================================
   INICIAR CATALOGO
   ============================================ */

cargarCatalogo();

observeReveals();

/* ============================================
   SERVICE WORKER
   ============================================ */

if ("serviceWorker" in navigator) {
  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker.register(
        "./sw.js"
      ).catch(error => {
        console.warn(
          "Service Worker:",
          error
        );
      });
    }
  );
}
