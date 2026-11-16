/* SOBROU — protótipo estático. Dados locais, nenhuma integração ou transação real. */
const $ = (s, root = document) => root.querySelector(s);
const content = $('#app-content');
const modal = $('#modal');
const modalContent = $('#modal-content');
const money = value => Number(value).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
const icon = name => '<svg class="icon" aria-hidden="true"><use href="#i-'+name+'"/></svg>';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaultOffers = [
  {id:1,name:'Bowl especial do dia',store:'Verde Vivo',category:'Refeições',price:12.9,original:32.9,stock:4,km:1.2,time:'18:00 às 21:00',image:'bowl.jpg',description:'Refeição com frango grelhado, grãos e vegetais frescos. A composição pode variar conforme a disponibilidade.',active:true},
  {id:2,name:'Hambúrguer artesanal',store:'Casa do Burger',category:'Refeições',price:14.9,original:29.9,stock:3,km:2.1,time:'19:00 às 22:00',image:'burger.jpg',description:'Hambúrguer artesanal selecionado do excedente do dia. Uma ótima opção para o jantar.',active:true},
  {id:3,name:'Sacola surpresa da padaria',store:'Pão da Vila',category:'Padarias',price:9.9,original:24.9,stock:6,km:0.8,time:'17:00 às 19:00',image:'bread.jpg',description:'Uma seleção surpresa de pães e produtos da padaria. O conteúdo varia conforme o que sobrou no dia.',active:true},
  {id:4,name:'Caixa de doces variados',store:'Doce Momento',category:'Doces',price:11.9,original:27.9,stock:5,km:1.5,time:'16:00 às 20:00',image:'sweets.jpg',description:'Seleção de doces produzidos no dia. Ideal para adoçar seu lanche com economia.',active:true},
  {id:5,name:'Cesta de produtos selecionados',store:'Mercado da Praça',category:'Mercados',price:19.9,original:39.9,stock:3,km:3.0,time:'17:00 às 20:00',image:'bread.jpg',description:'Produtos selecionados próximos da validade, próprios para consumo. Confira os itens e suas datas na retirada.',active:true},
  {id:6,name:'Combo especial de almoço',store:'Verde Vivo',category:'Refeições',price:15.9,original:34.9,stock:2,km:1.2,time:'18:00 às 21:00',image:'hero.jpg',description:'Uma deliciosa refeição do excedente de produção do dia. Retirada presencial no restaurante.',active:true}
];
const read = (key, fallback) => {try { const data = localStorage.getItem('sobrou-v1-'+key); return data ? JSON.parse(data) : fallback; } catch { return fallback; }};
const save = (key,value) => {try {localStorage.setItem('sobrou-v1-'+key,JSON.stringify(value));} catch {}};
let offers = read('offers',structuredClone(defaultOffers)), favorites = read('favorites',[]), orders = read('orders',[]);
let view = 'home', category = 'Todos', search = '', sort = 'default', orderFilter = 'Todos', selected = null, quantity = 1, timer;
const routes = [{key:'home',label:'Início',icon:'home'},{key:'explore',label:'Explorar',icon:'search'},{key:'orders',label:'Pedidos',icon:'bag'},{key:'favorites',label:'Favoritos',icon:'heart'},{key:'profile',label:'Perfil',icon:'user'},{key:'merchant',label:'Área do parceiro',icon:'shop'}];
const categories = ['Todos','Refeições','Padarias','Mercados','Doces'];
const discount = o => Math.round((1-o.price/o.original)*100);
const distance = o => o.km < 1 ? Math.round(o.km*1000)+' m' : o.km.toLocaleString('pt-BR')+' km';
function notify(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(timer); timer = setTimeout(()=>toast.classList.remove('show'),2700);
}
function nav() {
  for (const el of [$('#desktop-nav'),$('#mobile-nav')]) el.innerHTML = routes.map(r=>'<button type="button" data-view="'+r.key+'" class="nav-item '+(view===r.key?'active':'')+'" '+(view===r.key?'aria-current="page"':'')+'>'+icon(r.icon)+'<span>'+r.label+'</span></button>').join('');
}
function go(next) {
  if (!routes.some(r=>r.key===next)) next='home';
  if (view !== next) {category='Todos';search='';sort='default';orderFilter='Todos';}
  view=next; if(location.hash!=='#'+next) location.hash=next;
  render(); window.scrollTo({top:0,behavior:'instant'});
}
window.addEventListener('hashchange',()=>{const next=location.hash.slice(1)||'home';if(next!==view)go(next);});
function title(h,p,withSearch=false) {
  return '<div class="app-title"><div><h1>'+h+'</h1><p>'+p+'</p></div>'+(withSearch?'<label class="searchbox">'+icon('search')+'<input id="search" type="search" placeholder="Buscar comida, restaurantes..." aria-label="Buscar ofertas" value="'+esc(search)+'"></label>':'')+'</div>';
}
function banner(merchant=false) {
  return '<div class="app-banner"><img src="assets/'+(merchant?'package.jpg':'hero.jpg')+'" alt=""><div><h2>'+(merchant?'Transforme excedentes<br><em>em oportunidades.</em>':'Comida boa.<br><em>Preço melhor.</em><br>Menos desperdício.')+'</h2><small>'+(merchant?'Venda mais, reduza perdas e alcance novos clientes.':'Resgate alimentos deliciosos com preços especiais.')+'</small></div></div>';
}
function chips(list,active,action) {
  return '<div class="category-bar">'+list.map(c=>'<button class="chip '+(c===active?'active':'')+'" data-'+action+'="'+esc(c)+'">'+esc(c)+'</button>').join('')+'</div>';
}
function card(o) {
  return '<article class="offer-card" tabindex="0" role="button" aria-label="Ver detalhes de '+esc(o.name)+'" data-offer="'+o.id+'"><div class="offer-image"><img src="assets/'+esc(o.image)+'" alt="'+esc(o.name)+'"><span class="discount">−'+discount(o)+'%</span><button class="favorite-btn '+(favorites.includes(o.id)?'filled':'')+'" data-favorite="'+o.id+'" aria-label="'+(favorites.includes(o.id)?'Remover dos favoritos':'Favoritar')+'" aria-pressed="'+favorites.includes(o.id)+'">'+icon('heart')+'</button></div><div class="offer-info"><h3>'+esc(o.name)+'</h3><div class="offer-meta">'+esc(o.store)+' · '+distance(o)+'</div><div class="offer-price"><strong>'+money(o.price)+'</strong><del>'+money(o.original)+'</del></div><div class="offer-bottom"><span>'+icon('clock')+' '+esc(o.time)+'</span><b>'+o.stock+' disp.</b></div></div></article>';
}
function empty(message,detail,action='explore') {
  return '<div class="empty">'+icon('bag')+'<h3>'+message+'</h3><p class="small-text">'+detail+'</p><button class="button button-dark" data-view="'+action+'">Explorar ofertas</button></div>';
}
function filteredOffers() {
  const q = search.trim().toLocaleLowerCase('pt-BR');
  let list = offers.filter(o=>o.active && o.stock>0 && (category==='Todos'||o.category===category) && (o.name+' '+o.store+' '+o.category).toLocaleLowerCase('pt-BR').includes(q));
  if (sort==='distance')list.sort((a,b)=>a.km-b.km);
  if (sort==='price')list.sort((a,b)=>a.price-b.price);
  if (sort==='discount')list.sort((a,b)=>discount(b)-discount(a));
  return list;
}
function drawGrid() {
  const list = view==='favorites' ? offers.filter(o=>favorites.includes(o.id)&&o.active&&o.stock>0) : filteredOffers();
  const grid = $('#offers'); if(grid)grid.innerHTML=list.length?list.map(card).join(''):empty(view==='favorites'?'Nenhum favorito ainda':'Nenhuma oferta encontrada',view==='favorites'?'Toque no coração de uma oferta para salvá-la aqui.':'Tente outro termo ou categoria.');
  const counter = $('#result-count'); if(counter)counter.textContent=list.length+' ofertas';
}
function render() {
  nav();
  if(view==='home'||view==='explore') {
    content.innerHTML=title(view==='home'?'Olá, Mariana! 👋':'Explore as ofertas',view==='home'?'Que tal economizar e fazer a diferença hoje?':'Encontre oportunidades perto de você.',true)+(view==='home'?banner():'')+chips(categories,category,'category')+'<div class="subheading"><h2>'+(view==='home'?'Ofertas perto de você':'Todas as ofertas')+'</h2>'+(view==='home'?'<button data-view="explore">Ver todas →</button>':'<select id="sort" class="sort-control" aria-label="Ordenar ofertas"><option value="default">Recomendadas</option><option value="distance">Mais próximas</option><option value="price">Menor preço</option><option value="discount">Maior desconto</option></select>')+'</div><div class="offer-grid" id="offers"></div>';
    if($('#sort'))$('#sort').value=sort;
    drawGrid();
  } else if(view==='favorites') {
    content.innerHTML=title('Meus favoritos','Suas ofertas preferidas em um único lugar.')+'<div class="offer-grid" id="offers"></div>';drawGrid();
  } else if(view==='orders') {
    const list = orders.filter(o=>orderFilter==='Todos'||o.status===orderFilter);
    content.innerHTML=title('Meus pedidos','Acompanhe suas reservas e códigos para retirada.')+chips(['Todos','Aguardando retirada','Retirado'],orderFilter,'order-filter')+'<div class="orders-list">'+(list.length?list.map(orderCard).join(''):empty('Nenhum pedido por aqui','Reserve uma oferta para acompanhar seu pedido.'))+'</div>';
  } else if(view==='profile') {
    content.innerHTML=title('Meu perfil','Gerencie sua experiência no Sobrou.')+'<div class="profile-card"><div class="profile-person"><div class="avatar">MS</div><div><h2>Mariana Silva</h2><p>mariana@exemplo.com · Conta demonstrativa</p></div></div>'+[['orders','bag','Meus pedidos'],['favorites','heart','Meus favoritos'],['merchant','shop','Área do estabelecimento']].map(r=>'<button class="profile-link" data-view="'+r[0]+'">'+icon(r[1])+r[2]+'<span>›</span></button>').join('')+'<a class="profile-link" href="index.html">'+icon('home')+'Sobre o Sobrou <span>›</span></a><div class="notice">Você está navegando em um protótipo. Não é necessário criar uma conta real.</div><button class="button button-outline wide" data-action="reset">Reiniciar demonstração</button></div>';
  } else if(view==='merchant') {
    const own=offers.filter(o=>o.store==='Pão da Vila' || o.merchant);
    const merchantOrders=orders.filter(o=>o.store==='Pão da Vila');
    content.innerHTML=title('Painel do estabelecimento','Pão da Vila · Gerencie suas ofertas e aproveitamento.')+banner(true)+'<div class="merchant-stats"><div class="stat"><small>Ofertas ativas</small><strong>'+own.filter(o=>o.active&&o.stock>0).length+'</strong></div><div class="stat"><small>Reservas por aqui</small><strong>'+merchantOrders.length+'</strong></div><div class="stat"><small>Receita em reservas</small><strong>'+money(merchantOrders.reduce((a,o)=>a+o.total,0))+'</strong></div></div><button class="button button-orange" data-action="new-offer">+ Criar nova oferta</button><div class="subheading"><h2>Minhas ofertas</h2><span>'+own.length+' cadastrada(s)</span></div>'+own.map(o=>'<div class="merchant-offer"><img src="assets/'+esc(o.image)+'" alt=""><div><b>'+esc(o.name)+'</b><small>'+money(o.price)+' · '+o.stock+' disponíveis</small></div><button class="toggle '+(o.active?'':'off')+'" data-toggle="'+o.id+'" aria-label="'+(o.active?'Desativar':'Ativar')+' oferta" aria-pressed="'+o.active+'"></button></div>').join('');
  }
}
function orderCard(o) {
  return '<div class="order-card"><div class="order-top"><span>Pedido #'+esc(o.code)+'</span><span class="pill '+(o.status==='Retirado'?'green':'')+'">'+o.status+'</span></div><div class="order-summary"><img src="assets/'+esc(o.image)+'" alt=""><div><b>'+esc(o.name)+'</b><small>'+esc(o.store)+' · '+o.quantity+' unidade(s)</small><strong>'+money(o.total)+'</strong></div></div><div class="order-actions"><span>'+icon('clock')+' Retirada: '+esc(o.time)+'</span></div><div class="order-code">Código de retirada<strong>'+esc(o.code)+'</strong></div><div class="order-actions"><button class="button button-outline" data-copy="'+esc(o.code)+'">Copiar código</button>'+(o.status==='Aguardando retirada'?'<button class="button button-dark" data-pickup="'+esc(o.code)+'">Simular retirada</button>':'')+'</div></div>';
}
function showModal(html) {modalContent.innerHTML=html;if(!modal.open)modal.showModal();modal.scrollTop=0;}
function modalTop(name) {return '<header class="modal-top"><h2 id="modal-title">'+name+'</h2><button class="close-btn" data-action="close" aria-label="Fechar">×</button></header>';}
function details(id) {
  selected=offers.find(o=>o.id===id&&o.active&&o.stock>0);if(!selected)return;
  quantity=1;drawDetails();
}
function drawDetails() {
  const o=selected;if(!o)return;
  showModal(modalTop('Detalhes da oferta')+'<img class="modal-photo" src="assets/'+esc(o.image)+'" alt="'+esc(o.name)+'"><div class="modal-body"><span class="discount">−'+discount(o)+'% de desconto</span><h2>'+esc(o.name)+'</h2><div class="offer-meta">'+icon('pin')+' '+esc(o.store)+' · '+distance(o)+' · Porto Alegre, RS</div><div class="offer-price"><strong>'+money(o.price)+'</strong><del>'+money(o.original)+'</del><span class="pill green">'+o.stock+' disponíveis</span></div><h3 style="margin-top:22px;font-size:16px;color:var(--green)">Sobre esta oferta</h3><p>'+esc(o.description)+'</p><div class="modal-detail"><div>'+icon('clock')+' Retirada hoje: '+esc(o.time)+'</div><div>'+icon('pin')+' '+esc(o.store)+' · Porto Alegre</div><div>'+icon('check')+' Alimentos próprios para consumo</div><div>'+icon('check')+' Verifique a validade e conservação na retirada</div></div><div class="quantity-row"><span>Quantidade</span><div class="quantity"><button data-qty="-1" aria-label="Diminuir quantidade">−</button><span id="quantity-value">'+quantity+'</span><button data-qty="1" aria-label="Aumentar quantidade">+</button></div></div><button class="button button-orange wide" data-action="checkout" id="reserve-button">Reservar por '+money(quantity*o.price)+'</button></div>');
}
function checkout() {
  const o=selected;if(!o)return;
  showModal(modalTop('Finalizar reserva')+'<div class="modal-body"><h3 style="margin-bottom:15px;font-size:17px">Resumo do pedido</h3><div class="order-summary"><img src="assets/'+esc(o.image)+'" alt=""><div><b>'+esc(o.name)+'</b><small>'+esc(o.store)+' · '+quantity+' unidade(s)</small><strong>'+money(o.price)+'</strong></div></div><div class="total-row"><span>Total</span><span>'+money(quantity*o.price)+'</span></div><h3 style="margin-top:22px;font-size:16px">Forma de pagamento</h3><div class="payment-options"><label><input type="radio" name="payment" value="Pix" checked> Pix</label><label><input type="radio" name="payment" value="Cartão de crédito"> Cartão de crédito</label><label><input type="radio" name="payment" value="Na retirada"> Pagar na retirada</label></div><div class="notice">Esta é uma simulação. Nenhuma cobrança será realizada.</div><button class="button button-orange wide" data-action="confirm">Confirmar reserva</button><button style="margin-top:10px" class="button button-outline wide" data-action="back-details">Voltar</button></div>');
}
function confirmOrder() {
  const o=selected;if(!o||o.stock<quantity){notify('Quantidade indisponível.');return;}
  const code='SB'+(1001+orders.length);
  const order={code,name:o.name,store:o.store,image:o.image,quantity,total:quantity*o.price,time:o.time,status:'Aguardando retirada',payment:$('input[name=payment]:checked')?.value||'Pix'};
  orders.unshift(order);o.stock-=quantity;save('orders',orders);save('offers',offers);render();
  showModal(modalTop('Reserva confirmada')+'<div class="success"><div class="success-icon">✓</div><h2 id="success-title">Reserva confirmada!</h2><p class="small-text" style="margin-top:12px">Seu pedido foi registrado. Retire no horário combinado e aproveite!</p><div class="order-code">Código de retirada<strong>'+code+'</strong><span class="pill">Aguardando retirada</span></div><button class="button button-dark wide" data-action="view-orders">Ver meus pedidos</button><button style="margin-top:10px" class="button button-outline wide" data-action="close">Continuar explorando</button></div>');
  selected=null;
}
function offerForm() {
  showModal(modalTop('Nova oferta')+'<div class="modal-body"><p>Cadastre uma oferta de demonstração para o seu estabelecimento.</p><form id="offer-form" class="offer-form"><label>Nome da oferta<input required maxlength="70" name="name" placeholder="Ex.: Sacola de pães"></label><label>Categoria<select name="category">'+categories.slice(1).map(c=>'<option>'+c+'</option>').join('')+'</select></label><div class="form-row"><label>Preço original (R$)<input type="number" min=".01" step=".01" name="original" required placeholder="24,90"></label><label>Preço promocional (R$)<input type="number" min=".01" step=".01" name="price" required placeholder="9,90"></label></div><label>Quantidade disponível<input name="stock" type="number" min="1" max="999" value="5" required></label><div class="form-row"><label>Retirada de<input type="time" required name="from" value="17:00"></label><label>Até<input type="time" required name="to" value="19:00"></label></div><label>Descrição<input name="description" maxlength="160" placeholder="Detalhes, validade e conservação"></label><button class="button button-orange wide" type="submit">Publicar oferta</button></form></div>');
}
document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if (button) {
    if(button.dataset.view){go(button.dataset.view);return;}
    if(button.dataset.category){category=button.dataset.category;render();return;}
    if(button.dataset.orderFilter){orderFilter=button.dataset.orderFilter;render();return;}
    if(button.dataset.favorite){const id=Number(button.dataset.favorite);favorites=favorites.includes(id)?favorites.filter(n=>n!==id):[...favorites,id];save('favorites',favorites);drawGrid();notify(favorites.includes(id)?'Oferta salva nos favoritos.':'Oferta removida dos favoritos.');return;}
    if(button.dataset.qty){quantity=Math.max(1,Math.min(selected.stock,quantity+Number(button.dataset.qty)));$('#quantity-value').textContent=quantity;$('#reserve-button').textContent='Reservar por '+money(selected.price*quantity);return;}
    if(button.dataset.toggle){const o=offers.find(x=>x.id===Number(button.dataset.toggle));o.active=!o.active;save('offers',offers);render();notify(o.active?'Oferta ativada.':'Oferta pausada.');return;}
    if(button.dataset.copy){const code=button.dataset.copy;if(navigator.clipboard?.writeText)navigator.clipboard.writeText(code).then(()=>notify('Código copiado: '+code)).catch(()=>notify('Código: '+code));else notify('Código: '+code);return;}
    if(button.dataset.pickup){const o=orders.find(x=>x.code===button.dataset.pickup);o.status='Retirado';save('orders',orders);render();notify('Retirada registrada na simulação.');return;}
    switch(button.dataset.action){case'close':modal.close();return;case'checkout':checkout();return;case'back-details':drawDetails();return;case'confirm':confirmOrder();return;case'view-orders':modal.close();go('orders');return;case'new-offer':offerForm();return;case'reset':if(confirm('Reiniciar os dados da demonstração?')){offers=structuredClone(defaultOffers);orders=[];favorites=[];save('offers',offers);save('orders',orders);save('favorites',favorites);go('home');notify('Demonstração reiniciada.');}return;}
  }
  const card=event.target.closest('[data-offer]');if(card)details(Number(card.dataset.offer));
});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-offer]')){e.preventDefault();details(Number(e.target.dataset.offer));}});
document.addEventListener('input',e=>{if(e.target.id==='search'){search=e.target.value;drawGrid();}});
document.addEventListener('change',e=>{if(e.target.id==='sort'){sort=e.target.value;drawGrid();}});
document.addEventListener('submit',e=>{
  if(e.target.id!=='offer-form')return;e.preventDefault();
  const data=new FormData(e.target);const original=Number(data.get('original')),price=Number(data.get('price'));
  if(price>=original){notify('O preço promocional deve ser menor que o original.');return;}
  if(data.get('from')>=data.get('to')){notify('Informe um horário de retirada válido.');return;}
  const cat=data.get('category'),images={'Refeições':'bowl.jpg','Padarias':'bread.jpg','Doces':'sweets.jpg','Mercados':'bread.jpg'};
  offers.push({id:Date.now(),name:data.get('name'),store:'Pão da Vila',category:cat,price,original,stock:Number(data.get('stock')),km:.8,time:data.get('from')+' às '+data.get('to'),image:images[cat],description:data.get('description')||'Oferta de excedentes do dia, própria para consumo.',active:true,merchant:true});
  save('offers',offers);modal.close();render();notify('Oferta publicada na demonstração!');
});
modal.addEventListener('click',e=>{if(e.target===modal){const rect=modal.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)modal.close();}});
go(location.hash.slice(1)||'home');
if('serviceWorker' in navigator && ['https:','http:'].includes(location.protocol))navigator.serviceWorker.register('./sw.js').catch(()=>{});
