main()

async function main(){
    let selected = canvas.tokens.controlled;
    if(selected.length == 0){
      ui.notifications.error("Sélectionnez le token qui attaque, et uniquement ce token")
      return;
    }
    let selectedActor = selected[0].actor;
let effectDuration = "0";
const effect = "icons/svg/net.svg";

//for(let token in selected ){

selected.forEach(token => {
    console.log(selected);
    let duration = 1;
    if(effectDuration != "0"){
        duration = new Roll(effectDuration).evaluate().total;
    }
    let appliedEffect = new EffectCounter(duration, effect, token, false);
    appliedEffect.update();
    console.log(appliedEffect)
})
}