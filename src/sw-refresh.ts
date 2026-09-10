if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw.js?v=10',{updateViaCache:'none'}).then(reg=>reg.update()).catch(()=>{});
  });
}
