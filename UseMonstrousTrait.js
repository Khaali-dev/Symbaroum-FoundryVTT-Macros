main()

async function main(){

    // Get selected token --> selectedActor
    let selected = canvas.tokens.controlled;
    if(selected.length > 1 || selected.length == 0){
        ui.notifications.error("Sélectionnez le token qui utilise le pouvoir, et uniquement ce token")
        return;
    }
    let selectedActor = selected[0].actor;
    let selectedToken = selected[0];

    // chack wether power using token is controlled by a player
    let MysticIsPC = selectedActor.hasPlayerOwner;

    console.log(selected[0]);

    // Get all powers belonging to selectedActor, and some abilities 
    let actorPowers = selectedActor.items.filter(item => item.data?.isTrait ||
                                                         item.data?.name === "Soumission");

    if(actorPowers.length == 0){
        ui.notifications.error("Le personnage selectionné n'a aucun trait ou pouvoir reconnu par la macro.");
        return;
    }

    //evaluate which attribute to use (for mystic powers and some traits)
    let castingAttribute = selectedActor.data.data.attributes["resolute"];
    let resoluteV = selectedActor.data.data.attributes["resolute"].value;
    let hasLeader = selectedActor.items.filter(item => item.data?.name === "Meneur né");
    if(hasLeader.length > 0){
        let persuasiveV = selectedActor.data.data.attributes["persuasive"].value;
        if(resoluteV < persuasiveV) {
            castingAttribute = selectedActor.data.data.attributes["persuasive"];
        }
    }

    // building the traits menu
    let powerOptions = ""
    for(let item of actorPowers){
        powerOptions += `<option value=${item.id}>${item.data.name}</option>`;
    }
    let dialogTemplate = `
    <h1> Quel trait utilisez-vous? </h1>
    <div style="display:flex">
        <select     id="power">${powerOptions}</select></div>
    </div>
    <div style="display:flex">
        <span style="flex:1">Modificateur au jet? <input  id="mod" type="number" style="width:80px;float:right" value=0 /></span>
    </div>
    <div style="display:flex">
        <span style="flex:1">Maintenir un trait déjà actif? <input  id="keep" type="checkbox" unchecked /></span>
    </div>
    `;
    new Dialog({
        title: "Choix du pouvoir ou du talent", 
        content: dialogTemplate,
        buttons: {
            choosePwr: {
                label: "Choix du pouvoir ou du talent", 
                callback: (html) => {
                    // get the power and the link to its data in the actor template
                    let PowerID = html.find("#power")[0].value;
                    let Pwr = selectedActor.items.find(item => item.id == PowerID)
                    let rollData = { 
                        castingAttribute : castingAttribute,
                        modifier : Number(html.find("#mod")[0].value),
                        isMaintained : html.find("#keep")[0].checked,
                        mysticCursed : false
                    }
                    console.log(Pwr);

                    //get power level
                    let powerLvl = 1;
                    let lvlName = "Novice";
                    if(Pwr.data.data.master.isActive){
                        powerLvl = 3;
                        lvlName = "Maître";
                    }
                    else if(Pwr.data.data.adept.isActive){
                        powerLvl = 2;
                        lvlName = "Adepte";
                    }
                    console.log(PowerID);
                    console.log(powerLvl);

                    // is the mystic cursed?
                    const CursedEffect = "icons/svg/sun.svg";
                    let cursedEffectCounter = EffectCounter.findCounter(selectedToken, CursedEffect);
                    if(cursedEffectCounter != undefined){
                        rollData.mysticCursed = true;
                    };
                    let chatTemplate = "";
                    if(!rollData.isMaintained){
                        chatTemplate = `
                        <p> ${selectedActor.data.name} essaie d'utiliser ${Pwr.data.name} au niveau ${lvlName}. </p>
                        `;
                    }
                    else{
                        chatTemplate = `
                        <p> ${selectedActor.data.name} de maintenir ${Pwr.data.name}. </p>
                        `;
                    }
                    ChatMessage.create({
                        speaker: {
                        alias: selectedActor.name
                        },
                        content: chatTemplate
                    })

                    const powerName = Pwr.data.name;
                    switch (powerName) {
                        
                        case 'Soumission':
                            try{bendWill(selectedActor, Pwr, powerLvl, rollData)} catch(error){
                        
                                ui.notifications.error(error);
                                return;
                           };
                           evaluateCorruption(selectedActor, rollData);
                        break;
                        case 'Toile':
                            if(rollData.isMaintained){
                                rollData.castingAttribute = selectedActor.data.data.attributes["cunning"];
                            }
                            else{
                                rollData.castingAttribute = selectedActor.data.data.attributes["accurate"];
                            }
                            try{webTrait(selectedActor, Pwr, powerLvl, rollData)} catch(error){
                                ui.notifications.error(error);
                                return;
                            };
                        break;
                        default:
                            ui.notifications.error("Ce trait n'est pas encore intégré dans le script");
                    }
                }
            }, 
            close: {
                label: "Close"
            }
        }
    }).render(true);
}


//get the target token, its actor, and evaluate which attribute this actor will use for opposition
function getTarget(targetAttributeName) {
    let targets = Array.from(game.user.targets)  // targets renvoie un ensemble, on le transforme en tableau avec array.from
    if(targets.length == 0 || targets.length > 1 ){
      throw "Choisissez une (seule) cible";
    }
    let targetToken = targets[0];
    let targetActor = targets[0].actor;

    //is target cursed?
    let targetCursed = false;
    const CursedEffect = "icons/svg/sun.svg";
    let cursedEffectCounter = EffectCounter.findCounter(targetToken, CursedEffect);
    if(cursedEffectCounter != undefined){
        targetCursed = true;
    };


     // get target attribute
    let resistValue = 0;
    if(targetAttributeName != undefined)
    {
        resistValue = targetActor.data.data.attributes[targetAttributeName].value;
        if(targetAttributeName == "resolute")
        {
            let hasLeader = targetActor.items.filter(item => item.data?.name === "Meneur né");
            if(hasLeader.length > 0){
                let persuasiveV = targetActor.data.data.attributes["persuasive"].value;
                if(resistValue < persuasiveV) {
                    resistValue = persuasiveV;
                }
            }
        }

    }
    return{
        token : targetToken,
        actor : targetActor,
        resistValue : resistValue,
        targetCursed : targetCursed
    } ;
}

// function for rolling the main attribute test. 
function rollPwr(selectedActor, Pwr, powerLvl, rollData, targetData) {

    //roll 1d20
    let rollP;

    // check who makes the roll : if a PC is a target in opposition, it's the PC who makes the roll
    //check statuses and bonuses that will have the player roll 2 dices, and keep the highest or lowest


///verifier qui fait le jet: selected ou target?
    let selectedRolls = true;
    let resistValue = 0;
    let targetCursed = false;
    if(targetData != undefined){
        resistValue = targetData.resistValue;
        targetCursed = targetData.targetCursed;
    }


    if(resistValue != 0){
        if((!selectedActor.hasPlayerOwner)  && targetData.actor.hasPlayerOwner)
        {
            selectedRolls = false;
        }
    }

    if(selectedRolls){
        if(resistValue != 0){
            if(rollData.mysticCursed){
                if(targetCursed){
                    rollP = new Roll("1d20").evaluate();
                }
                else{
                    rollP = new Roll("2d20kh").evaluate();
                }  
            }
            else if(targetCursed){
                rollP = new Roll("2d20kl").evaluate();
            }
            else{
                rollP = new Roll("1d20").evaluate();
            }
        }
        else if(rollData.mysticCursed){
            rollP = new Roll("2d20kh").evaluate();
        }
        else{
            rollP = new Roll("1d20").evaluate();
        }
    }
    else{
        if(targetCursed){
            if(rollData.mysticCursed){
                rollP = new Roll("1d20").evaluate();
            }
            else{
                rollP = new Roll("2d20kh").evaluate();
            }  
        }
        else if(rollData.mysticCursed){
            rollP = new Roll("2d20kl").evaluate();
        }
        else{
            rollP = new Roll("1d20").evaluate();
        }
    }
    rollP.toMessage();

    console.log("result of the roll:");
    console.log(rollP.total);
    return(rollP);
};

function evaluateCorruption(selectedActor, rollData){
    let corruptionChatMessage = "";
    let corruptionDice = "1d4";
    let receivedCorruption = 0;
    if(rollData.isMaintained){
        corruptionChatMessage = `
        <p> Maitien du pouvoir, pas de nouveau gain de corruption.</p>
        `
    }
    else{
        if(rollData.fullCorruption){
            if(selectedActor.hasPlayerOwner){
                rollP = new Roll(corruptionDice).evaluate();
                rollP.toMessage();
                receivedCorruption = rollP.total;
            }
            else{receivedCorruption = 2}
        }
        else{receivedCorruption = 1}
        corruptionChatMessage +=`
        <p> ${selectedActor.data.name} reçoit ${receivedCorruption} points de corruption temporaire.</p>
        `;
        selectedActor.data.data.health.corruption.temporary += receivedCorruption;
        if(selectedActor.data.data.health.corruption.temporary + selectedActor.data.data.health.corruption.permanent > selectedActor.data.data.health.corruption.threshold){
            corruptionChatMessage +=`
            <p> ${selectedActor.data.name} dépasse son seuil de corruption.</p>
            `;
        }
    }
    ChatMessage.create({
        speaker: {
            alias: selectedActor.name
        },
        content: corruptionChatMessage
    })
}

function webTrait(selectedActor, Pwr, powerLvl, rollData) {
    if(powerLvl == 1){
        ui.notifications.error("Niveau 1, pas suffisant");
        return;
    }
    // get target
    let targetData;
    if(rollData.isMaintained){
        try{targetData = getTarget("strong")} catch(error){      
            ui.notifications.error(error);
            return;
        }
    }
    else{
        try{targetData = getTarget("quick")} catch(error){      
            ui.notifications.error(error);
            return;
        }
    }
    let rolled = rollPwr(selectedActor, Pwr, powerLvl, rollData, targetData);
    const webEffect = "icons/svg/net.svg";
    let statEffectCounter = EffectCounter.findCounter(targetData.token, webEffect);

    let effectChatMessage = "";
    // if the actor performing the action is a player
    if (selectedActor.hasPlayerOwner){

        let difficulty = rollData.castingAttribute.value - targetData.resistValue + 10 + rollData.modifier;
        effectChatMessage =`
        <p> Difficulté = ${difficulty}</p> 
        `;
        if(rolled.total <= difficulty){
            effectChatMessage +=`
                <p> ${targetData.actor.data.name} est englué dans la toile.</p>
                `;
                if(statEffectCounter == undefined){
                    let statEffect = new EffectCounter(1, webEffect, targetData.token, false);
                    statEffect.update();
                }
        }
        else{
            effectChatMessage +=`
                <p> ${targetData.actor.data.name} se libère de la toile gluante.</p>
                `;
            if(statEffectCounter != undefined){
    
                statEffectCounter.setValue(0,targetData.token, false);
                statEffectCounter.update();
            }
        }
    }
    else{
        let difficulty = targetData.resistValue - rollData.castingAttribute.value + 10 + rollData.modifier;
        effectChatMessage =`
        <p> Difficulté = ${difficulty}</p> 
        `;      
        if(rolled.total <= difficulty){
            effectChatMessage +=`
                <p> ${targetData.actor.data.name} se libère de la toile gluante.</p>
                `;
            if(statEffectCounter != undefined){
    
                statEffectCounter.setValue(0,targetData.token, false);
                statEffectCounter.update();
            }
        }
        else{
            effectChatMessage +=`
                <p> ${targetData.actor.data.name}  est englué dans la toile.</p>
                `;
            if(statEffectCounter == undefined){
                let statEffect = new EffectCounter(1, webEffect, targetData.token, false);
                statEffect.update();
            }
 
        }
    }
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: effectChatMessage
    })
}














function anathema(selectedActor, Pwr, powerLvl, rollData) {
    // get target
    let targetData;
    try{targetData = getTarget("resolute")} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let rolled = rollPwr(selectedActor, Pwr, powerLvl, rollData, targetData);

    let effectChatMessage = "";
    // if the actor performing the action is a player
    if (selectedActor.hasPlayerOwner){

        let difficulty = rollData.castingAttribute.value - targetData.resistValue + 10 + rollData.modifier;
        effectChatMessage =`
        <p> Difficulté = ${difficulty}</p> 
        `;
        if(rolled.total <= difficulty){
            effectChatMessage +=`
                <p> ${selectedActor.data.name} supprime l'effet du pouvoir lancé par ${targetData.actor.data.name}.</p>
                `
        }
        else{
            effectChatMessage +=`
                <p> ${selectedActor.data.name} ne parvient pas à supprimer l'effet du pouvoir lancé par ${targetData.actor.data.name}.</p>
                `
        }
    }
    else{
        let difficulty = targetData.resistValue - rollData.castingAttribute.value + 10 + rollData.modifier;
        effectChatMessage =`
        <p> Difficulté = ${difficulty}</p> 
        `;      
        if(rolled.total <= difficulty){
            effectChatMessage +=`
                <p> ${targetData.actor.data.name} parvient à résister à la tentative de dissipation par ${selectedActor.data.name}.</p>
                `
        }
        else{
            effectChatMessage +=`
                <p> ${targetData.actor.data.name} voit son effet dissipé par ${selectedActor.data.name}.</p>
                `
        }
    }
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: effectChatMessage
    })

    return ;
}

function bendWill(selectedActor, Pwr, powerLvl, rollData) {
    // getr target
    let targetData;
    try{targetData = getTarget("resolute")} catch(error){      
        ui.notifications.error(error);
        return;
    }

    let rolled = rollPwr(selectedActor, Pwr, powerLvl, rollData, targetData);
    let effectChatMessage = "";
    // if the actor performing the action is a player
    if (selectedActor.hasPlayerOwner){

        let difficulty = rollData.castingAttribute.value - targetData.resistValue + 10 + rollData.modifier;
        effectChatMessage =`
        <p> Difficulté = ${difficulty}</p> 
        `;
        if(rolled.total <= difficulty){
            effectChatMessage +=`
                <p> ${selectedActor.data.name} parvient à imposer sa volonté à ${targetData.actor.data.name}.</p>
                `
        }
        else{
            effectChatMessage +=`
                <p> ${selectedActor.data.name} ne parvient pas à vaincre briser la volonté de ${targetData.actor.data.name}.</p>
                `
        }
    }
    else{
        let difficulty = targetData.resistValue - rollData.castingAttribute.value + 10 + rollData.modifier;
        effectChatMessage =`
        <p> Difficulté = ${difficulty}</p> 
        `;      
        if(rolled.total <= difficulty){
            effectChatMessage +=`
                <p> ${targetData.actor.data.name} parvient à résister à la tentative de soumission par ${selectedActor.data.name}.</p>
                `
        }
        else{
            effectChatMessage +=`
                <p> ${targetData.actor.data.name} est contrôlé par ${selectedActor.data.name}.</p>
                `
        }
    }
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: effectChatMessage
    })

    return ;
}

function curse(selectedActor, Pwr, powerLvl, rollData) {
    
    let targetData;
    try{targetData = getTarget()} catch(error){      
        ui.notifications.error(error);
        return;
    }
    const effect = "icons/svg/sun.svg";
    let cursedEffect = new EffectCounter(1, effect, targetData.token, false);
    cursedEffect.update();
    
    let effectChatMessage = `<p> ${targetData.actor.data.name} est maudit!.</p>`;
    if(powerLvl == 3)
    {
        effectChatMessage += `<p> ${targetData.actor.data.name} est pris de douleurs dès qu'il essaie d'accomplir une action (1d6 dégâts ignorant l'armure).</p>`;
    }
    else{
        effectChatMessage += `<p> ${targetData.actor.data.name} n'a vraiment pas de chance (pour chaque action, il jette 2d20 et garde le moins avantageux).</p>`;
    };
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: effectChatMessage
    })

    return ;
}

function holyAura(selectedActor, Pwr, powerLvl, rollData, selectedToken) {
 
    let rolled = rollPwr(selectedActor, Pwr, powerLvl, rollData);
    let effectChatMessage = "";
    
    if(rolled.total <= rollData.castingAttribute.value){

        effectChatMessage += `
        <p> ${selectedActor.data.name} est entourée d'une aura lumineuse bienfaisante.</p>
        `;
        //add effect status on token
        const pEffect = "icons/svg/aura.svg";
        let poisonedEffect = new EffectCounter(0, pEffect, selectedToken, false);
        poisonedEffect.update();

        let auraDamage = "1d6";
        let auraHeal = "1d4";
        if(powerLvl == 2){auraDamage = "1d8"}
        else if(powerLvl == 3){auraDamage = "1d10"; auraHeal = "1d6"}
        
        let abTheurgy = selectedActor.items.filter(item => item.data?.name === "Théurgie");
        let isTheurgeMaster = false;
        if(abTheurgy.length > 0){
            if(abTheurgy[0].data.data.master.isActive){
                auraDamage += " + 1d4";
                auraHeal += " + 1d4";
            }
        }

        if(powerLvl == 1){
            effectChatMessage += `
            <p> Les abominations et mort-vivants subissent ${auraDamage} points de dégats, sauf ceux exclus de l'effet par ${selectedActor.data.name}.</p>
            `;
        }
        else if(powerLvl == 2){
            effectChatMessage += `
            <p> Les abominations et mort-vivants prennent ${auraDamage} points de dégats, sauf ceux exclus de l'effet par ${selectedActor.data.name} et les créatures vivantes sont soignées de ${auraHeal} points.</p>
            `;
        }
        else{
            effectChatMessage += `
            <p> Les abominations et mort-vivants prennent ${auraDamage} points de dégats, sauf ceux exclus de l'effet par ${selectedActor.data.name} et les créatures alliées vivantes sont soignées de ${auraHeal} points.</p>
            `;
        }
    }
    else{
        effectChatMessage += `
        <p> ${selectedActor.data.name} ne parvient pas à canaliser la lumière de Prios.</p>
        `;
    }
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: effectChatMessage
    });

}

function inheritWound(selectedActor, Pwr, powerLvl, rollData, selectedToken) {
    let targetData;
    try{targetData = getTarget("resolute")} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let targetActor = targetData.actor;
    let rolled = rollPwr(selectedActor, Pwr, powerLvl, rollData, targetData);
    let effectChatMessage = "";
    let healDice = "1d6";

    if(powerLvl >= 2){
        healDice = "1d8"
    }

    if(rolled.total <= rollData.castingAttribute.value){

        let healRoll = new Roll(healDice).evaluate();
        healRoll.toMessage();
        let healedDamage = healRoll.total;
        if(targetActor.data.data.health.toughness.value + healedDamage > targetActor.data.data.health.toughness.max){
            healedDamage = targetActor.data.data.health.toughness.max - targetActor.data.data.health.toughness.value;
            targetActor.data.data.health.toughness.value = targetActor.data.data.health.toughness.max;

        }
        else {targetActor.data.data.health.toughness.value = targetActor.data.data.health.toughness.value + healedDamage;}

        effectChatMessage = `
        <p> ${selectedActor.data.name} soigne ${targetActor.data.name} de ${healedDamage} points d'endurance.</p>
        `
        let inheritDamage = healedDamage;
        if(powerLvl >= 2){
            inheritDamage = Math.ceil(healedDamage /2);
        }
        selectedActor.data.data.health.toughness.value = selectedActor.data.data.health.toughness.value - inheritDamage;
        effectChatMessage += `
        <p> Les blessures apparaissent sur ${selectedActor.data.name}, qui perd ${inheritDamage} points d'endurance.</p>
        `
        if(powerLvl >= 2){
            
            const pEffect = "icons/svg/poison.svg";
            let poisonedEffectCounter = EffectCounter.findCounter(targetData.token, pEffect);
  
              
            if(poisonedEffectCounter != undefined){
            //target  poisoned
            //get the number of rounds left
            let poisonedTimeLeft = EffectCounter.findCounterValue(targetData.token, pEffect);
            //set status to caster
            let poisonedEffect = new EffectCounter(poisonedTimeLeft, pEffect, selectedToken, false);
            poisonedEffect.update();
            //remove status from target
            poisonedEffectCounter.setValue(0,targetData.token, false);
            poisonedEffectCounter.update();


            effectChatMessage += `
              <p> ${selectedActor.data.name} reçoit le poison de ${targetActor.data.name}. Il dure toujours ${poisonedTimeLeft} rounds mais ne fera à ${selectedActor.data.name} que la moitié des dommages prévus.</p>
              `;
            }

        }
    }
    else{
        effectChatMessage += `
        <p> ${selectedActor.data.name} ne parvient pas à partager les blessures de ${targetActor.data.name}.</p>
        `;
    }
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: effectChatMessage
    });

}

function larvaeBoils(selectedActor, Pwr, powerLvl, rollData) {
 
    let targetData;
    try{targetData = getTarget("strong")} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let effectChatMessage = `<p> Des larves commencent à dévorer ${curseTarget.actor.data.name} de l'intérieur.</p>`;
    let effectDamage = "1d4";
    if(powerLvl == 2){
        effectDamage = "1d6";
    }
    else if(powerLvl == 3){
        effectDamage = "1d8";
    }
    effectChatMessage = `<p>${curseTarget.actor.data.name} subira ${effectDamage} points de dégats chaque tour.</p>`
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: effectChatMessage
    })
}

function loremaster(selectedActor, Pwr, powerLvl, rollData) {
    console.log("érudition lancée");
    
    let rolled = rollPwr(selectedActor, Pwr, powerLvl, rollData);
    let effectChatMessage = "";

    if(rolled.total <= rollData.castingAttribute.value){
        effectChatMessage =`
            <p> ${selectedActor.data.name} en sait quelquechose.</p>
            `
    }
    else{
        effectChatMessage =`
            <p> ${selectedActor.data.name} ne sait pas grand chose sur ce sujet.</p>
            `
    }
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: effectChatMessage
    })
    return ;
}

function medicus(selectedActor, Pwr, powerLvl, rollData) {
    // besoin d'une cible
    let targetData; 
    try{targetData = getTarget()} catch(error){
        throw error;
    };
    let targetActor = targetData.actor;
    let RemdyDialogTemplate = `
    <h1> Voulez-vous utiliser un remède à base de plantes? </h1>
    `;
    let PlantRemedy = false;
    let healFormula = "1d4";
    let healFormulaMasterFailed = "1d4";

    new Dialog({
        title: "Utilisation ou non d'un remede", 
        content: RemdyDialogTemplate,
        buttons: {
            chooseRem: {
                label: "Avec remède", 
                callback: (html) => {                 
                    PlantRemedy = true;

                    if(powerLvl == 1){
                        healFormula = "1d6"
                    }
                    else if(powerLvl == 2){
                        healFormula = "1d8"
                    }
                    else{
                        healFormula = "1d10";
                        healFormulaMasterFailed = "1d6";
                    }
                    medicusHeal(selectedActor, targetActor, Pwr, powerLvl, rollData, PlantRemedy, healFormula, healFormulaMasterFailed);
                }
            }, 

            chooseNotRem: {
                label: "Sans remède", 
                callback: (html) => {             
                    PlantRemedy = false;
                    if(powerLvl == 1){
                        healFormula = "1d4"
                    }
                    else if(powerLvl == 2){
                        healFormula = "1d6"
                    }
                    else{
                        healFormula = "1d8";
                        healFormulaMasterFailed = "1d4";
                    }
                    medicusHeal(selectedActor, targetActor, Pwr, powerLvl, rollData, PlantRemedy, healFormula, healFormulaMasterFailed);
                }
            },
            close: {
                label: "Close"
            }
        }
    }).render(true);
}
       
function medicusHeal(selectedActor, targetActor, Pwr, powerLvl, rollData, PlantRemedy, healFormula, healFormulaMasterFailed) {
    let rolled = rollPwr(selectedActor, Pwr, powerLvl, rollData);
    let effectChatMessage = "";

    if(rolled.total <= rollData.castingAttribute.value){

        let healRoll = new Roll(healFormula).evaluate();
        healRoll.toMessage();
        if(targetActor.data.data.health.toughness.value + healRoll.total > targetActor.data.data.health.toughness.max){
            targetActor.data.data.health.toughness.value = targetActor.data.data.health.toughness.max;
        }
        else {targetActor.data.data.health.toughness.value = targetActor.data.data.health.toughness.value + healRoll.total;}

        if(PlantRemedy){
            effectChatMessage =`
            <p> ${selectedActor.data.name} soigne ${targetActor.data.name} avec un remède à base de plantes pour ${healRoll.total} points d'endurance.</p>
            `
        }
        else{
            effectChatMessage = `
            <p> ${selectedActor.data.name} soigne ${targetActor.data.name} (sans remède) pour ${healRoll.total} points d'endurance.</p>
            `
        }
    }
    else{
        if(powerLvl == 3){
            let healRoll = new Roll(healFormulaMasterFailed).evaluate();
            healRoll.toMessage();
            if(targetActor.data.data.health.toughness.value + healRoll.total > targetActor.data.data.health.toughness.max){
                targetActor.data.data.health.toughness.value = targetActor.data.data.health.toughness.max;
            }
            else {targetActor.data.data.health.toughness.value = targetActor.data.data.health.toughness.value + healRoll.total;}
            if(PlantRemedy){
                effectChatMessage =`
                <p> ${selectedActor.data.name} soigne ${targetActor.data.name} avec un remède à base de plantes pour ${healRoll.total} points d'endurance.</p>
                `
            }
            else{
                effectChatMessage = `
                <p> ${selectedActor.data.name} soigne ${targetActor.data.name} (sans remède) pour ${healRoll.total} points d'endurance.</p>
                `
            }
        }
        else{
            effectChatMessage = `
            <p> Aie! Quelle brute!</p>
            `
        }
    }
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: effectChatMessage
    });
}

function witchsight(selectedActor, Pwr, powerLvl, rollData) {
    // is there a target?
    let targets = Array.from(game.user.targets);
    let targetData;
    let isTargeted = false;
    if(targets.length != 0){
      isTargeted = true;
      try{targetData = getTarget("discreet")} catch(error){
        
        throw error;
        };
    }
       
    let rolled = rollPwr(selectedActor, Pwr, powerLvl, rollData, targetData);
    let effectChatMessage = "";

    if(rolled.total <= rollData.castingAttribute.value + rollData.modifier){
        if(isTargeted){
            effectChatMessage =`
            <p> ${selectedActor.data.name} perçoit l'ombre de ${targetData.actor.data.name}. ${targetData.actor.data.data.bio.shadow}</p>
            `
        }
        else{
            effectChatMessage =`
            <p> ${selectedActor.data.name} perçoit les ombres.</p>
            `
        }
    }
    else{
        effectChatMessage =`
            <p> ${selectedActor.data.name} ne parvient pas à percevoir les ombres.</p>
            `
    }
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: effectChatMessage
    })
    return ;
}