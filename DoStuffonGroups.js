main()

async function main(){

    let actionOptions = `
    <option value="heal">Soigner les selectionnés </option>
    <option value="damage">Blesser les selectionnés </option>
    <option value="status">mettre un effet sur les selectionnés </option>
    <option value="clear">Supprimer tous les effets</option>
    `

    let effectOptions = "";
    for(let effectT of [
      { label : 'Aucun', icon : "none" },
      { label : 'Aura', icon : "icons/svg/aura.svg" },
      { label : 'Aveuglé', icon : "icons/svg/blind.svg" },
      { label : 'Ciblé (chasseur)', icon : "icons/svg/target.svg" },
      { label : 'Ciblé (meneur né)', icon : "icons/svg/downgrade.svg" },
      { label : 'Empoisonné', icon : "icons/svg/poison.svg" },
      { label : 'En feu', icon : "icons/svg/fire.svg" },
      { label : 'Hemorragie', icon : "icons/svg/bloodt.svg" },
      { label : 'Immobilisé', icon : "icons/svg/net.svg" },
      { label : 'Maudit', icon : "icons/svg/sun.svg" }
    ]){
        effectOptions += `<option value=${effectT.icon}>${effectT.label} </option>`
    }


    let dialogTemplate = `
    <h1> Que voulez - vous faire sur les tokens selectionnés? </h1>
    <div style="display:flex">
    <div  style="flex:1"><select     id="action">${actionOptions}</select></div>
    </div>
    <div style="display:flex">
      <span style="flex:1">Ignore l'armure? <input      id="ign" type="checkbox" unchecked /></span>
    </div>
    <div style="display:flex">
      <span style="flex:1">Dégâts infligés <input  id="damage" type="text" style="width:80px;float:right" value="0" /></span>
    </div>
    <div style="display:flex">
    <span style="flex:1">Soins apportés <input  id="heal" type="text" style="width:80px;float:right" value="0" /></span>
  </div>
    <div style="display:flex">
      <div  style="flex:1"><select     id="status">${effectOptions}</select></div>
    </div>
    <div style="display:flex">
    <span style="flex:1">Durée de l'effet <input  id="duration" type="text" style="width:80px;float:right" value="0" /></span>
  </div>
    `;
  
  
    new Dialog({
        title: "Action sur un groupe", 
        content: dialogTemplate,
        buttons: {
            rollAtk: {
                label: "Lancer l'action",
                callback: (html) => {
                    let selected = canvas.tokens.controlled;
                    if(selected.length == 0){
                        ui.notifications.error("Sélectionnez les tokens affectés")
                        return;
                    }

                    // recupere les éléments selectionnés par le joueur dans la fenetre html et les transforme en variables propres
                    let actionToDo = html.find("#action")[0].value;
                    let effect = html.find("#status")[0].value;
                    let effectDuration = html.find("#duration")[0].value;
                    let ignoreArm = html.find("#ign")[0].checked;
                    let healFormula = html.find("#heal")[0].value;
                    let damageFormula = html.find("#damage")[0].value;
                    
                    if(effect != "none"){
                        applyEffect(selected, effect, effectDuration)
                    }
                    if(actionToDo == "clear"){
                        clearEffects(selected)
                    }
                    if(actionToDo == "heal"){
                        healTokens(selected, healFormula)
                    }
                    if(actionToDo == "damage"){
                        damageTokens(selected, damageFormula, ignoreArm);
                    }
                }
            }, 
            close: {
                label: "Close"
            }
        }
    }).render(true)
}

async function applyEffect(selected, effect, effectDuration){
    for (const token of selected) {
        let duration = 1;
        if(effectDuration != "0"){
            duration = new Roll(effectDuration).evaluate().total;
        }
        let appliedEffect = new EffectCounter(duration, effect, token, false);
        appliedEffect.update();
        console.log(appliedEffect)
    }
}

async function clearEffects(selected){
    for (const token of selected) {
        let allEffects = await EffectCounter.getAllCounters(token);
        for (const effect of allEffects){
            await effect.remove()
        }
    }
}

async function healTokens(selected, healFormula){
    
    for (const token of selected) {
        let healRoll = new Roll(healFormula).evaluate();
        healRoll.toMessage();
        let healed = Math.min(healRoll.total, token.actor.data.data.health.toughness.max - token.actor.data.data.health.toughness.value);
        await token.actor.update({"data.health.toughness.value" : token.actor.data.data.health.toughness.value + healed});
        token.drawBars();
        let effectChatMessage =`
        <p> ${token.actor.data.name} est soigné de ${healRoll.total} (${healed}) points d'endurance.</p>
        `;
        ChatMessage.create({
            speaker: {
            alias: token.actor.name
            },
            content: effectChatMessage
        });
    }
}

async function damageTokens(selected, damageFormula, ignoreArm){
    for (const token of selected) {
        let effectChatMessage = "";
            if(!ignoreArm){
                let armorProt = token.actor.data.data.combat.protection;
                damageFormula += " - " + armorProt
            }
            let damageRoll = new Roll(damageFormula).evaluate();
            let targetDies = false;
            let dmgTot = Math.max(damageRoll.total, 0);
                    
            if(token.actor.data.data.health.toughness.value - dmgTot <= 0){
                dmgTot = token.actor.data.data.health.toughness.value;
                targetDies = true;
                const skullEffect = "icons/svg/skull.svg";
                let deathEffect = new EffectCounter(1, skullEffect, token, false);
                deathEffect.update();
            }
            await token.actor.update({"data.health.toughness.value" : token.actor.data.data.health.toughness.value - dmgTot});
            await token.drawBars();
            effectChatMessage += `
            <p> ${token.actor.data.name} prend ${dmgTot} points de dégâts.</p>
            `;
            if(targetDies){
                effectChatMessage += `
            <p> ${token.actor.data.name} est mortellement touché.</p>
            `;
            }
        ChatMessage.create({
            speaker: {
                alias: "Gamemaster"
            },
            content: effectChatMessage
        })
    }
}