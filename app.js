const products = [
  {id:'ji-001',name:'Jícara Ópalo',category:'macetas',code:'JI-001',size:'Extra grande',dimensions:'35 cm × 120 cm',image:'assets/producto-01.jpg',description:'Diseño de gran capacidad con acabado texturizado; admite distintos colores y terminados.'},
  {id:'ji-002',name:'Jícara Herrería',category:'macetas',code:'JI-002',size:'Grande',dimensions:'44 cm × 92 cm',image:'assets/producto-02.jpg',description:'Estilo clásico de gran capacidad, fabricado en fibra de vidrio con acabado decorativo.'},
  {id:'ji-003',name:'Maceta Rubí',category:'macetas',code:'JI-003',size:'Grande',dimensions:'30 cm × 83 cm',image:'assets/producto-03.jpg',description:'Diseño tipo tina, terminado liso y colores a elección para interiores o exteriores.'},
  {id:'ji-011',name:'Maceta Copa',category:'decoracion',code:'JI-011',size:'Grande',dimensions:'62 cm × 52 cm',image:'assets/producto-04.jpg',description:'Pieza de diseñador con una silueta moderna para dar carácter a accesos y jardines.'},
  {id:'ja-002',name:'Maceta Cacao',category:'jarrones',code:'JA-002',size:'Mediana',dimensions:'72 cm × 60 cm',image:'assets/producto-05.jpg',description:'Jarrón de presencia elegante con acabados lisos o patinados, hecho a elección.'},
  {id:'ja-003',name:'Jarrón Sonora',category:'jarrones',code:'JA-003',size:'Grande',dimensions:'94 cm × 40 cm',image:'assets/producto-06.jpg',description:'Diseño alto y minimalista para plantas o decoración, disponible en el color elegido.'},
  {id:'co-001',name:'Copa Rey',category:'decoracion',code:'CO-001',size:'Mediana',dimensions:'45 cm × 32 cm',image:'assets/producto-07.jpg',description:'Copa decorativa de diseño original y terminación personalizable para distintos usos.'},
  {id:'co-002',name:'Copa León',category:'decoracion',code:'CO-002',size:'Mediana',dimensions:'52 cm × 41 cm',image:'assets/producto-08.jpg',description:'Estilo copa pensado para vestir fachadas, patios y composiciones ornamentales.'},
  {id:'oll-001',name:'Tina Italiana',category:'macetas',code:'OLL-001',size:'Chica',dimensions:'30 cm × 45 cm',image:'assets/producto-09.jpg',description:'Maceta que recrea la apariencia de terracota con la ligereza de la fibra de vidrio.'},
  {id:'oll-002',name:'Maceta Caborca',category:'macetas',code:'OLL-002',size:'Chica',dimensions:'45 cm × 59 cm',image:'assets/producto-10.jpg',description:'Diseño de dos cabos con una presencia contemporánea, ligera y resistente.'},
  {id:'oll-010',name:'Maceta Apple Grande',category:'macetas',code:'OLL-010',size:'Grande',dimensions:'43 cm × 59 cm',image:'assets/producto-11.jpg',description:'Silueta redondeada, durable y disponible en diversos colores y acabados.'},
  {id:'pergola',name:'Pérgola a medida',category:'proyectos',code:'Proyecto',size:'Personalizada',dimensions:'Según espacio',image:'assets/producto-12.jpg',description:'Solución ligera y resistente al clima para terrazas, patios, jardines o comercios.'}
];

const services = [
  {id:'serv-proyecto',name:'Desarrollo de proyectos',description:'Diseño arquitectónico o decorativo adaptado a tu espacio.',image:'assets/categoria-macetas.png'},
  {id:'serv-moldes',name:'Fabricación y moldes',description:'Creación de elementos personalizados con alta calidad y detalle.',image:'assets/categoria-accesorios.png'},
  {id:'serv-asesoria',name:'Asesoría de diseño',description:'Apoyo para elegir forma, tamaño, color y acabado entre más de 100 diseños.',image:'assets/producto-04.jpg'},
  {id:'serv-instalacion',name:'Instalación profesional',description:'Acompañamiento e instalación de piezas y estructuras en fibra de vidrio.',image:'assets/producto-02.jpg'},
  {id:'serv-reparacion',name:'Reparación y mantenimiento',description:'Atención para piezas y estructuras existentes en fibra de vidrio.',image:'assets/categoria-fuentes.png'},
  {id:'serv-pergola',name:'Pérgolas personalizadas',description:'Diseño resistente al clima para espacios residenciales o comerciales.',image:'assets/producto-12.jpg'}
];

const allItems = [...products, ...services.map(item => ({...item,code:'Servicio',size:'',dimensions:'',category:'servicio'}))];
const grid = document.querySelector('#product-grid');
const serviceStack = document.querySelector('#service-stack');
const drawer = document.querySelector('.cart-drawer');
const backdrop = document.querySelector('.drawer-backdrop');
const cartItems = document.querySelector('#cart-items');
const emptyCart = document.querySelector('#empty-cart');
const quoteTotal = document.querySelector('#quote-total');
const form = document.querySelector('#quote-form');
const toast = document.querySelector('#toast');
let cart = JSON.parse(localStorage.getItem('resinas-pacifico-cart') || '{}');

function escapeHtml(value='') {
  return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function renderProducts(filter='todos') {
  grid.innerHTML = products.map((product, index) => `
    <article class="product-card reveal" data-category="${product.category}" ${filter !== 'todos' && product.category !== filter ? 'hidden' : ''}>
      <div class="product-media">
        <img src="${product.image}" alt="Trabajo de referencia en fibra de vidrio" loading="lazy" width="500" height="500">
        <span class="product-badge">${product.code}</span>
      </div>
      <div class="product-body">
        <span class="product-kicker">${index < 11 ? 'Macetas y accesorios' : 'Proyecto a medida'}</span>
        <h3>${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-meta"><span>${product.size}</span><span>${product.dimensions}</span></div>
        <div class="product-footer">
          <span class="quote-price"><small>Precio</small><strong>Cotizar</strong></span>
          <button class="add-button ${cart[product.id] ? 'added' : ''}" type="button" data-add="${product.id}" aria-label="Agregar ${product.name} a la solicitud">+</button>
        </div>
      </div>
    </article>`).join('');
  observeReveals();
}

function renderServices() {
  serviceStack.innerHTML = services.map((service,index) => `
    <article class="service-card" style="--i:${index}">
      <img src="${service.image}" alt="" loading="lazy" width="180" height="140">
      <div><span class="service-number">0${index+1} · Servicio</span><h3>${service.name}</h3><p>${service.description}</p></div>
      <button type="button" data-add="${service.id}" aria-label="Agregar ${service.name} a la solicitud">+</button>
    </article>`).join('');
}

function saveCart() {
  localStorage.setItem('resinas-pacifico-cart', JSON.stringify(cart));
  renderCart();
  document.querySelectorAll('[data-add]').forEach(button => button.classList.toggle('added', Boolean(cart[button.dataset.add])));
}

function addItem(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  showToast('Agregado a tu solicitud');
}

function updateItem(id, delta) {
  cart[id] = (cart[id] || 0) + delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
}

function renderCart() {
  const entries = Object.entries(cart).filter(([,qty]) => qty > 0);
  const count = entries.reduce((sum,[,qty]) => sum + qty, 0);
  document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
  emptyCart.hidden = entries.length > 0;
  quoteTotal.hidden = entries.length === 0;
  form.hidden = entries.length === 0;
  cartItems.innerHTML = entries.map(([id,qty]) => {
    const item = allItems.find(candidate => candidate.id === id);
    if (!item) return '';
    return `<div class="cart-item">
      <img src="${item.image}" alt="" width="72" height="72">
      <div><h3>${escapeHtml(item.name)}</h3><small>${escapeHtml(item.code || 'Servicio')} · Precio por cotizar</small><button class="remove-item" type="button" data-remove="${id}">Eliminar</button></div>
      <div class="qty"><button type="button" data-qty="${id}" data-delta="-1" aria-label="Restar uno">−</button><strong>${qty}</strong><button type="button" data-qty="${id}" data-delta="1" aria-label="Agregar uno">+</button></div>
    </div>`;
  }).join('');
}

function openCart() {
  backdrop.hidden = false;
  requestAnimationFrame(() => drawer.classList.add('open'));
  drawer.setAttribute('aria-hidden','false');
  document.body.classList.add('drawer-open');
  drawer.querySelector('.icon-button').focus();
}

function closeCart() {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden','true');
  document.body.classList.remove('drawer-open');
  setTimeout(() => { backdrop.hidden = true; }, 350);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function observeReveals() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), {threshold:.12});
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => observer.observe(el));
}

document.addEventListener('click', event => {
  const add = event.target.closest('[data-add]');
  const remove = event.target.closest('[data-remove]');
  const qty = event.target.closest('[data-qty]');
  const open = event.target.closest('[data-open-cart]');
  const close = event.target.closest('[data-close-cart]');
  if (add) addItem(add.dataset.add);
  if (remove) { delete cart[remove.dataset.remove]; saveCart(); }
  if (qty) updateItem(qty.dataset.qty, Number(qty.dataset.delta));
  if (open) openCart();
  if (close) closeCart();
});

document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  const filter = button.dataset.filter;
  document.querySelectorAll('.product-card').forEach(card => card.hidden = filter !== 'todos' && card.dataset.category !== filter);
}));

document.querySelectorAll('input[name="delivery"]').forEach(input => input.addEventListener('change', () => {
  const addressField = document.querySelector('#address-field');
  const needsAddress = input.checked && input.value === 'Entrega a domicilio';
  if (input.checked) {
    addressField.hidden = !needsAddress;
    addressField.querySelector('input').required = needsAddress;
  }
}));

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!Object.keys(cart).length) { showToast('Agrega un producto o servicio'); return; }
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const lines = Object.entries(cart).map(([id,qty]) => {
    const item = allItems.find(candidate => candidate.id === id);
    return `• ${qty} × ${item.name}${item.code ? ` (${item.code})` : ''}`;
  });
  const delivery = data.get('delivery');
  const address = data.get('address');
  const message = [
    'Hola, Resinas del Pacífico. Deseo solicitar una cotización:', '',
    ...lines, '',
    `Nombre: ${data.get('name')}`,
    `Teléfono: ${data.get('phone')}`,
    `Entrega: ${delivery}`,
    address ? `Dirección: ${address}` : '',
    `Pago preferido: ${data.get('payment')}`,
    data.get('notes') ? `Observaciones: ${data.get('notes')}` : '', '',
    'Entiendo que precio, disponibilidad, pago y entrega están sujetos a confirmación.'
  ].filter(Boolean).join('\n');
  window.open(`https://wa.me/523221200860?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
});

document.addEventListener('keydown', event => { if (event.key === 'Escape' && drawer.classList.contains('open')) closeCart(); });
renderProducts();
renderServices();
renderCart();
observeReveals();

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
