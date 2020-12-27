main()

async function main(){

    // Get selected token --> selectedActor
    let selected = canvas.tokens.controlled;
    if(selected.length > 1 || selected.length == 0){
        ui.notifications.error("Sélectionnez le token qui utilise le pouvoir, et uniquement ce token")
        return;
    }
    let selectedActor = selected[0].actor;
<<<<<<< HEAD
    let selectedToken = selected[0];
=======
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13

    // chack wether power using token is controlled by a player
    let MysticIsPC = selectedActor.hasPlayerOwner;

    console.log(selected[0]);

    // Get all powers belonging to selectedActor, and some abilities 
<<<<<<< HEAD
    let actorPowers = selectedActor.items.filter(item => item.data?.type === "mysticalPower" ||
=======
    let actorPowers = selectedActor.items.filter(item => item.data?.isMysticalPower ||
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
                                                         item.data?.name === "Médicus" ||
                                                         item.data?.name === "Érudit" ||
                                                         item.data?.name === "Étrangleur" ||
                                                         item.data?.name === "Vision de l'Ombre");

    if(actorPowers.length == 0){
        ui.notifications.error("Le personnage selectionné n'a aucun pouvoir ou talent reconnu par la macro.");
        return;
    }

    //evaluate which attribute to use (for mystic powers)
<<<<<<< HEAD
    let selectedAttribute = selectedActor.data.data.attributes["resolute"];
=======
    let castingAttribute = selectedActor.data.data.attributes["resolute"];
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
    let resoluteV = selectedActor.data.data.attributes["resolute"].value;
    let hasLeader = selectedActor.items.filter(item => item.data?.name === "Meneur né");
    if(hasLeader.length > 0){
        let persuasiveV = selectedActor.data.data.attributes["persuasive"].value;
        if(resoluteV < persuasiveV) {
            selectedAttribute = selectedActor.data.data.attributes["persuasive"];
        }
        console.log("Mystic power attribut");
<<<<<<< HEAD
        console.log(selectedAttribute);
    }

    let htmlTemplate = await renderTemplate("worlds/Shared_data/Templates/dialog-power.html",{
        powers : actorPowers, isFullDisplay : false });

=======
        console.log(castingAttribute);
    }

    // building the power menu
    let powerOptions = ""
    for(let item of actorPowers){
        powerOptions += `<option value=${item.id}>${item.data.name}</option>`;
    }
    let dialogTemplate = `
    <h1> Quel pouvoir utilisez-vous? </h1>
    <div style="display:flex">
        <select     id="power">${powerOptions}</select></div>
    </div>
    <div style="display:flex">
        <span style="flex:1">Etes-vous maudit? <input      id="mCursed" type="checkbox" unchecked /></span>
    </div>
    <div style="display:flex">
        <span style="flex:1">La cible est-elle maudite? <input      id="tCursed" type="checkbox" unchecked /></span>
    </div>
    <div style="display:flex">
        <span style="flex:1">Modificateur au jet? <input  id="mod" type="number" style="width:80px;float:right" value=0 /></span>
    </div>
    <div style="display:flex">
        <span style="flex:1">Maintenir un pouvoir déjà actif? <input  id="keep" type="checkbox" unchecked /></span>
    </div>
    `;
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
    new Dialog({
        title: "Choix du pouvoir ou du talent", 
        content: htmlTemplate,
        buttons: {
            choosePwr: {
                label: "Choix du pouvoir ou du talent", 
                callback: (html) => {
                    // get the power and the link to its data in the actor template
                    let PowerID = html.find("#power")[0].value;
                    let Pwr = selectedActor.items.find(item => item.id == PowerID)
                    let rollData = { 
<<<<<<< HEAD
                        selectedAttribute : selectedAttribute,
                        modifier : Number(html.find("#mod")[0].value),
                        isMaintained : html.find("#keep")[0].checked,
                        fullCorruption: html.find("#mysTrad")[0].checked,
                        selectedCursed : false
=======
                        castingAttribute : castingAttribute,
                        modifier : Number(html.find("#mod")[0].value),
                        mysticCursed : html.find("#mCursed")[0].checked,
                        targetCursed : html.find("#tCursed")[0].checked,
                        isMaintained : html.find("#keep")[0].checked
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
                    }
                    console.log(Pwr);

                    //get power level
<<<<<<< HEAD
                    let powerLvl = 1;
=======
                    let PowerLvl = 1;
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
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
                        rollData.selectedCursed = true;
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

                    console.log("Pouvoir:");
                    console.log(Pwr);
                    let targetData;
                    const powerName = Pwr.data.name;
                    switch (powerName) {
                        case 'Anathème':
                            try{anathema(selectedActor, Pwr, powerLvl, rollData)} catch(error){
                            ui.notifications.error(error);
                            return;
                        };
                        evaluateCorruption(selectedActor, rollData);
                        break;
                        case 'Aura sacrée':
                            try{holyAura(selectedActor, Pwr, powerLvl, rollData, selectedToken)} catch(error){
                            ui.notifications.error(error);
                            return;
                        };
                        if(!rollData.isMaintained){
                            evaluateCorruption(selectedActor, rollData);
                        };
                        break;
                        case 'Blessure partagée':
                            try{inheritWound(selectedActor, Pwr, powerLvl, rollData, selectedToken)} catch(error){
                
                            ui.notifications.error(error);
                            return;
                        };
                        evaluateCorruption(selectedActor, rollData);
                        break;
                        case 'Médicus':
<<<<<<< HEAD
                        rollData.selectedAttribute = selectedActor.data.data.attributes["cunning"];
                        try{medicus(selectedActor, Pwr, powerLvl, rollData)} catch(error){
                            ui.notifications.error(error);
                            return;
                        };
                        break;

                        case 'Érudit':
                            rollData.selectedAttribute = selectedActor.data.data.attributes["cunning"];
                            try{loremaster(selectedActor, Pwr, powerLvl, rollData)} catch(error){
                                ui.notifications.error(error);
                                return;
                            };
                        break;
                        case 'Malédiction':
                            try{curse(selectedActor, Pwr, powerLvl, rollData)} catch(error){
                                ui.notifications.error(error);
                                return;
                            };
                            if(!rollData.isMaintained){
                                evaluateCorruption(selectedActor, rollData);
                            };
                        break;
                        case 'Profusion de larves':
                            try{larvaeBoils(selectedActor, Pwr, powerLvl, rollData)} catch(error){
                                ui.notifications.error(error);
                                return;
                            };
                            if(!rollData.isMaintained){
                                evaluateCorruption(selectedActor, rollData);
                            };
                        break;
                        case 'Soumission':
                            try{bendWill(selectedActor, Pwr, powerLvl, rollData)} catch(error){
=======
                            rollData.castingAttribute = selectedActor.data.data.attributes["cunning"];
                            
                            // there is no attribute for resistance, resolute is here for compatibility but will be ignored
                            try{targetData = getTarget("resolute")} catch(error){      
                                ui.notifications.error(error);
                                return;
                            }
                         
                            try{medicus(selectedActor, Pwr, PowerLvl, rollData, targetData)} catch(error){
                        
                                ui.notifications.error(error);
                                return;
                            };
                            break;

                            case 'Érudit':
                                rollData.castingAttribute = selectedActor.data.data.attributes["cunning"];
                            try{loremaster(selectedActor, Pwr, PowerLvl, rollData)} catch(error){
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
                                ui.notifications.error(error);
                                return;
                           };
                           if(!rollData.isMaintained){
                            evaluateCorruption(selectedActor, rollData);
                            };
<<<<<<< HEAD
                        break;
                        case 'Étrangleur':
                            rollData.selectedAttribute = selectedActor.data.data.attributes["cunning"];
                            try{stranglerMaint(selectedActor, Pwr, powerLvl, rollData)} catch(error){
                                ui.notifications.error(error);
                                return;
                           };
                        break;
                        case 'Vision de l\'Ombre':
                            rollData.selectedAttribute = selectedActor.data.data.attributes["vigilant"];
                            try{witchsight(selectedActor, Pwr, powerLvl, rollData)} catch(error){
=======
                            break;

                            case 'Blessure partagée':
                                try{targetData = getTarget("resolute")} catch(error){      
                                    ui.notifications.error(error);
                                    return;
                                }
                                try{inheritWound(selectedActor, Pwr, PowerLvl, rollData, targetData)} catch(error){
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
                        
                                    ui.notifications.error(error);
                                    return;
                                };
                            break;
                            case 'Malédiction':
                                try{targetData = getTarget("resolute")} catch(error){      
                                    ui.notifications.error(error);
                                    return;
                                }
                                try{curse(selectedActor, Pwr, PowerLvl, rollData, targetData)} catch(error){
                                    ui.notifications.error(error);
                                    return;
                                };
                            break;
                            case 'Soumission':
                                try{targetData = getTarget("resolute")} catch(error){      
                                    ui.notifications.error(error);
                                    return;
                                }
                                try{bendWill(selectedActor, Pwr, PowerLvl, rollData, targetData)} catch(error){
                            
                                    ui.notifications.error(error);
                                    return;
                            };
<<<<<<< HEAD
                            if(powerLvl == 3){rollData.fullCorruption = false}
                            else{rollData.fullCorruption = true}
                            evaluateCorruption(selectedActor, rollData);
                        break;
                        default:
=======
                            break;
                            case 'Vision de l\'Ombre':
                                rollData.castingAttribute = selectedActor.data.data.attributes["vigilant"];
                                try{witchsight(selectedActor, Pwr, PowerLvl, rollData)} catch(error){
                            
                                    ui.notifications.error(error);
                                    return;
                                };
                                break;
                             default:
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
                            ui.notifications.error("Ce pouvoir n'est pas encore intégré dans le script");
                    }
                }
            }, 
            close: {
                label: "Close"
            }
        }
    }).render(true);
}

<<<<<<< HEAD
=======

>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
//get the target token, its actor, and evaluate which attribute this actor will use for opposition
function getTarget(targetAttributeName) {
    let targets = Array.from(game.user.targets)  // targets renvoie un ensemble, on le transforme en tableau avec array.from
    if(targets.length == 0 || targets.length > 1 ){
      throw "Choisissez une (seule) cible";
    }
    let targetToken = targets[0];
<<<<<<< HEAD
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
=======
    let targetActor = targets[0].actor;  // targets est un tableau donc [0]
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
    return{token : targetToken, actor : targetActor, resistValue : resistValue } ;
}

function rollPwr(selectedActor, Pwr, PowerLvl, rollData, targetData) {

    //roll 1d20
    let rollP;
    //check statuses and bonuses that will have the player roll 2 dices, and keep the highest or lowest

    if(selectedActor.hasPlayerOwner){
        if(rollData.mysticCursed){
            rollP = new Roll("1d20kh").evaluate();
        }
        else if(rollData.targetCursed){
            rollP = new Roll("1d20kl").evaluate();
        }
        else{
            rollP = new Roll("1d20").evaluate();
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
        }

    }
<<<<<<< HEAD
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
            if(rollData.selectedCursed){
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
        else if(rollData.selectedCursed){
            rollP = new Roll("2d20kh").evaluate();
        }
        else{
            rollP = new Roll("1d20").evaluate();
        }
    }
    else{
        if(targetCursed){
            if(rollData.selectedCursed){
                rollP = new Roll("1d20").evaluate();
            }
            else{
                rollP = new Roll("2d20kh").evaluate();
            }  
        }
        else if(rollData.selectedCursed){
            rollP = new Roll("2d20kl").evaluate();
        }
        else{
            rollP = new Roll("1d20").evaluate();
        }
    }

=======
    else{  //the player is the defendant In symbaroum, it is always the player that rolls the dice
        if(rollData.mysticCursed){
            rollP = new Roll("1d20kl").evaluate();
        }
        else if(rollData.targetCursed){
            rollP = new Roll("1d20kh").evaluate();
        }
        else{
            rollP = new Roll("1d20").evaluate();
        }
    }
    rollP.toMessage();

>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
    console.log("result of the roll:");
    console.log(rollP.total);
    return(rollP);
};

<<<<<<< HEAD
async function evaluateCorruption(selectedActor, rollData){
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
                let rollP = new Roll(corruptionDice).evaluate();
                await rollP.toMessage();
                receivedCorruption = rollP.total;
            }
            else{receivedCorruption = 2}
        }
        else{receivedCorruption = 1}
        console.log("corrution:");
        console.log(receivedCorruption);
        corruptionChatMessage +=`
        <p> ${selectedActor.data.name} reçoit ${receivedCorruption} points de corruption temporaire.</p>
        `;
        await selectedActor.update({"data.health.corruption.temporary" : selectedActor.data.data.health.corruption.temporary + receivedCorruption});
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

function anathema(selectedActor, Pwr, powerLvl, rollData) {
    // get target
    let targetData;
    try{targetData = getTarget("resolute")} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let rolled = rollPwr(selectedActor, Pwr, powerLvl, rollData, targetData);
    rolled.toMessage();
=======
function bendWill(selectedActor, Pwr, PowerLvl, rollData, targetData) {

    let rolled = rollPwr(selectedActor, Pwr, PowerLvl, rollData, targetData); 
    console.log("targetdat=");
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13

    let effectChatMessage = "";
    // if the actor performing the action is a player
    if (selectedActor.hasPlayerOwner){

<<<<<<< HEAD
        let difficulty = rollData.selectedAttribute.value - targetData.resistValue + 10 + rollData.modifier;
=======
        let difficulty = rollData.castingAttribute.value - targetData.resistValue + 10 + rollData.modifier;
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
        effectChatMessage =`
        <p> Difficulté = ${difficulty}</p> 
        `;
        if(rolled.total <= difficulty){
            effectChatMessage +=`
<<<<<<< HEAD
                <p> ${selectedActor.data.name} supprime l'effet du pouvoir lancé par ${targetData.actor.data.name}.</p>
=======
                <p> ${selectedActor.data.name} parvient à imposer sa volonté à ${targetData.actor.data.name}.</p>
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
                `
        }
        else{
            effectChatMessage +=`
<<<<<<< HEAD
                <p> ${selectedActor.data.name} ne parvient pas à supprimer l'effet du pouvoir lancé par ${targetData.actor.data.name}.</p>
=======
                <p> ${selectedActor.data.name} ne parvient pas à vaincre briser la volonté de ${targetData.actor.data.name}.</p>
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
                `
        }
    }
    else{
<<<<<<< HEAD
        let difficulty = targetData.resistValue - rollData.selectedAttribute.value + 10 - rollData.modifier;
        effectChatMessage =`
        <p> Difficulté = ${difficulty}</p> 
        `;
        if(rolled.total <= difficulty){
            effectChatMessage +=`
                <p> ${targetData.actor.data.name} parvient à résister à la tentative de dissipation par ${selectedActor.data.name}.</p>
=======
        let difficulty = targetData.resistValue - rollData.castingAttribute.value + 10 + rollData.modifier;
        effectChatMessage =`
        <p> Difficulté = ${difficulty}</p> 
        `;      
        if(rolled.total <= Difficulty){
            effectChatMessage +=`
                <p> ${targetData.actor.data.name} parvient à résister à la tentative de soumission par ${selectedActor.data.name}.</p>
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
                `
        }
        else{
            effectChatMessage +=`
<<<<<<< HEAD
                <p> ${targetData.actor.data.name} voit son effet dissipé par ${selectedActor.data.name}.</p>
=======
                <p> ${targetData.actor.data.name} est contrôlé par ${selectedActor.data.name}.</p>
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
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
    rolled.toMessage();
    let effectChatMessage = "";
    // if the actor performing the action is a player
    if (selectedActor.hasPlayerOwner){

        let difficulty = rollData.selectedAttribute.value - targetData.resistValue + 10 + rollData.modifier;
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
        let difficulty = targetData.resistValue - rollData.selectedAttribute.value + 10 - rollData.modifier;
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

async function curse(selectedActor, Pwr, powerLvl, rollData) {
    
    let targetData;
    try{targetData = getTarget()} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let effectChatMessage = "";
    if(!rollData.isMaintained){
        if(!selectedActor.hasPlayerOwner){
            const effect = "icons/svg/sun.svg";
            let cursedEffect = new EffectCounter(1, effect, targetData.token, false);
            await cursedEffect.update();
        }
        effectChatMessage = `<p> ${targetData.actor.data.name} est maudit!.</p>`;
        if(powerLvl == 3)
        {
            effectChatMessage += `<p> ${targetData.actor.data.name} est pris de douleurs dès qu'il essaie d'accomplir une action (1d6 dégâts ignorant l'armure).</p>`;
        }
        else{
            effectChatMessage += `<p> ${targetData.actor.data.name} n'a vraiment pas de chance (pour chaque action, il jette 2d20 et garde le moins avantageux).</p>`;
        };
    }
    else{
        let rolled = rollPwr(selectedActor, Pwr, powerLvl, rollData, targetData);
        rolled.toMessage();
        if(rolled.total <= rollData.selectedAttribute.value + rollData.modifier){
            effectChatMessage +=`
            <p> ${selectedActor.data.name} maintient la malédiction sur ${targetData.actor.data.name}.</p>
            `;
        }
        else{
            effectChatMessage +=`
            <p> ${selectedActor.data.name} ne parvient pas à maintenir la malédiction sur ${targetData.actor.data.name}.</p>
            `;
            if(!selectedActor.hasPlayerOwner){
                const effect = "icons/svg/sun.svg";
                let cursedEffectCounter = EffectCounter.findCounter(targetData.token, effect);
                if(cursedEffectCounter != undefined){
                    cursedEffectCounter.setValue(0,targetData.token, false);
                    await cursedEffectCounter.update();
                }
            }
        }
    }
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: effectChatMessage
    })

<<<<<<< HEAD
    return ;
}

function holyAura(selectedActor, Pwr, powerLvl, rollData, selectedToken) {
 
    let rolled = rollPwr(selectedActor, Pwr, powerLvl, rollData);
    rolled.toMessage();
    let effectChatMessage = "";
    
    if(rolled.total <= rollData.selectedAttribute.value + rollData.modifier){

        effectChatMessage += `
        <p> ${selectedActor.data.name} est entourée d'une aura lumineuse bienfaisante.</p>
        `;
        //add effect status on token
        if(rollData.isMaintained){
            const pEffect = "icons/svg/aura.svg";
            let auraEffect = new EffectCounter(0, pEffect, selectedToken, false);
            auraEffect.update();
        };
        let auraDamage = "1d6";
        let auraHeal = "1d4";
        if(powerLvl == 2){auraDamage = "1d8"}
        else if(powerLvl == 3){auraDamage = "1d10"; auraHeal = "1d6"}
        
        let abTheurgy = selectedActor.items.filter(item => item.data?.name === "Théurgie");
        
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
        if(rollData.isMaintained){
            const effect = "icons/svg/aura.svg";
            let auraEffect = EffectCounter.findCounter(selectedToken, effect);
            if(auraEffect != undefined){
                auraEffect.setValue(0,selectedToken, false);
                auraEffect.update();
            }
            effectChatMessage += `
            <p> ${selectedActor.data.name} ne parvient plus à canaliser la lumière de Prios.</p>
            `;
        }
        else{
            effectChatMessage += `
            <p> ${selectedActor.data.name} ne parvient pas à canaliser la lumière de Prios.</p>
            `;
        };
    }
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: effectChatMessage
    });

}

async function inheritWound(selectedActor, Pwr, powerLvl, rollData, selectedToken) {
    let targetData;
    try{targetData = getTarget("resolute")} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let targetActor = targetData.actor;
    let rolled = rollPwr(selectedActor, Pwr, powerLvl, rollData, targetData);
    rolled.toMessage();
    let effectChatMessage = "";
    let healDice = "1d6";

    if(powerLvl >= 2){
        healDice = "1d8"
    }

    if(rolled.total <= rollData.selectedAttribute.value + rollData.modifier){

        let healRoll = new Roll(healDice).evaluate();
        healRoll.toMessage();
        let healed = Math.min(healRoll.total, targetActor.data.data.health.toughness.max - targetActor.data.data.health.toughness.value);        
        
        effectChatMessage = `
        <p> ${selectedActor.data.name} soigne ${targetActor.data.name} de ${healed} points d'endurance.</p>
        `
        let inheritDamage = healed;
        if(powerLvl >= 2){
            inheritDamage = Math.ceil(healed /2);
        }
        await selectedActor.update({"data.health.toughness.value" : selectedActor.data.data.health.toughness.value - inheritDamage});
        
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
            if(!selectedActor.hasPlayerOwner){
                poisonedEffectCounter.setValue(0,targetData.token, false);
                await poisonedEffectCounter.update();
            }
            
            effectChatMessage += `
              <p> ${selectedActor.data.name} reçoit le poison de ${targetActor.data.name}. Il dure toujours ${poisonedTimeLeft} rounds mais ne fera à ${selectedActor.data.name} que la moitié des dommages prévus.</p>
              `;
            }

        }
        if(!selectedActor.hasPlayerOwner){
        await targetActor.update({"data.health.toughness.value" : targetActor.data.data.health.toughness.value + healed});
        await targetData.token.drawBars();
        }
    }
    else{
        effectChatMessage += `
        <p> ${selectedActor.data.name} ne parvient pas à partager les blessures de ${targetActor.data.name}.</p>
        `;
    }
    selectedToken.drawBars();
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
    let effectChatMessage = "";
    if(!rollData.isMaintained){
        effectChatMessage = `<p> Des larves commencent à dévorer ${targetData.actor.data.name} de l'intérieur.</p>`;
        let effectDamage = "1d4";
        if(powerLvl == 2){
            effectDamage = "1d6";
        }
        else if(powerLvl == 3){
            effectDamage = "1d8";
        }
        effectChatMessage = `<p>${targetData.actor.data.name} subira ${effectDamage} points de dégats chaque tour.</p>`
    }
    else{
        let rolled = rollPwr(selectedActor, Pwr, powerLvl, rollData, targetData);
        rolled.toMessage();
        if (selectedActor.hasPlayerOwner){

            let difficulty = rollData.selectedAttribute.value - targetData.resistValue + 10 + rollData.modifier;
            effectChatMessage =`
            <p> Difficulté = ${difficulty}</p> 
            `;
            if(rolled.total <= difficulty){
                effectChatMessage +=`
                    <p> ${selectedActor.data.name} maintient les larves dans ${targetData.actor.data.name}.</p>
                    `
            }
            else{
                effectChatMessage +=`
                    <p> ${selectedActor.data.name} ne parvient pas à maintenir la profusion de larves.</p>
                    `
            }
        }
        else{
            let difficulty = targetData.resistValue - rollData.selectedAttribute.value + 10 - rollData.modifier;
            effectChatMessage =`
            <p> Difficulté = ${difficulty}</p> 
            `;
            if(rolled.total <= difficulty){
                effectChatMessage +=`
                    <p> ${targetData.actor.data.name} parvient à se débarasser des larves.</p>
                    `
            }
            else{
                effectChatMessage +=`
                    <p> ${targetData.actor.data.name} continue de se faire dévorer par les larves.</p>
                    `
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

function loremaster(selectedActor, Pwr, powerLvl, rollData) {
=======
function curse(selectedActor, Pwr, PowerLvl, rollData) {
    
    let curseTarget = getTarget();
    const effect = "icons/svg/daze.svg";
    let cursedEffect = new EffectCounter(1, effect, curseTarget.token, false);
    cursedEffect.update();
    
    let effectChatMessage = `<p> ${curseTarget.actor.data.name} est maudit!.</p>`;
    if(PowerLvl == 3)
    {
        effectChatMessage += `<p> ${curseTarget.actor.data.name} est pris de douleurs dès qu'il essaie d'accomplir une action (1d6 dégâts ignorant l'armure).</p>`;
    }
    else{
        effectChatMessage += `<p> ${curseTarget.actor.data.name} n'a vraiment pas de chance (pour chaque action, il jette 2d20 et garde le moins avantageux).</p>`;
    };
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: effectChatMessage
    })

    return ;
}

function inheritWound(selectedActor, Pwr, PowerLvl, rollData) {
    // besoin d'une cible
    let targetActor; 
    try{targetActor = getTarget()} catch(error){
        
        throw error;
    };
    console.log("Blessure partagée lancée");
    console.log(targetActor);
    return ;
}

function loremaster(selectedActor, Pwr, PowerLvl, rollData) {
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
    console.log("érudition lancée");
    
    let rolled = rollPwr(selectedActor, Pwr, powerLvl, rollData);
    rolled.toMessage();
    let effectChatMessage = "";

<<<<<<< HEAD
    if(rolled.total <= rollData.selectedAttribute.value){
        effectChatMessage =`
=======
    if(roll.total <= rollData.castingAttribute.value){
        LoremasterChatMessage =`
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
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

<<<<<<< HEAD
function medicus(selectedActor, Pwr, powerLvl, rollData) {
=======


function medicus(selectedActor, Pwr, PowerLvl, rollData) {
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
    // besoin d'une cible
    let targetData; 
    try{targetData = getTarget()} catch(error){
        throw error;
    };
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
<<<<<<< HEAD
                    medicusHeal(selectedActor, targetData, Pwr, powerLvl, rollData, PlantRemedy, healFormula, healFormulaMasterFailed);
=======
                    medicusHeal(selectedActor, targetActor, PowerLvl, rollData, PlantRemedy, healFormula, healFormulaMasterFailed);
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
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
<<<<<<< HEAD
                    medicusHeal(selectedActor, targetData, Pwr, powerLvl, rollData, PlantRemedy, healFormula, healFormulaMasterFailed);
=======
                    medicusHeal(selectedActor, targetActor, PowerLvl, rollData, PlantRemedy, healFormula, healFormulaMasterFailed);
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
                }
            },
            close: {
                label: "Close"
            }
        }
    }).render(true);
}
       
<<<<<<< HEAD
async function medicusHeal(selectedActor, targetData, Pwr, powerLvl, rollData, PlantRemedy, healFormula, healFormulaMasterFailed) {
    let rolled = rollPwr(selectedActor, Pwr, powerLvl, rollData);
    rolled.toMessage();
    let effectChatMessage = "";
    let targetActor = targetData.actor;
    if(rolled.total <= rollData.selectedAttribute.value){
=======
function medicusHeal(selectedActor, targetActor, PowerLvl, rollData, PlantRemedy, healFormula, healFormulaMasterFailed) {
    let roll = new Roll("1d20").evaluate();
    roll.toMessage();
    let HealChatMessage = "";

    if(roll.total <= rollData.castingAttribute.value){
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13

        let healRoll = new Roll(healFormula).evaluate();
        healRoll.toMessage();
        let healed = Math.min(healRoll.total, targetActor.data.data.health.toughness.max - targetActor.data.data.health.toughness.value);
        await targetActor.update({"data.health.toughness.value" : targetActor.data.data.health.toughness.value + healed});
        
 
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
            let healed = Math.min(healRoll.total, targetActor.data.data.health.toughness.max - targetActor.data.data.health.toughness.value);
            await targetActor.update({"data.health.toughness.value" : targetActor.data.data.health.toughness.value + healed});
            
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
    await targetData.token.drawBars();
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: effectChatMessage
    });
}

async function stranglerMaint(selectedActor, Pwr, powerLvl, rollData){
    let targetData;
    try{targetData = getTarget("cunning")} catch(error){      
        ui.notifications.error(error);
        return;
    }

    let rolled = rollPwr(selectedActor, Pwr, powerLvl, rollData, targetData);
    rolled.toMessage();
    let effectChatMessage = "";
    // if the actor performing the action is a player
    if (selectedActor.hasPlayerOwner){

        let difficulty = rollData.selectedAttribute.value - targetData.resistValue + 10 + rollData.modifier;
        effectChatMessage =`
        <p> Difficulté = ${difficulty}</p> 
        `;
        if(rolled.total <= difficulty){
            effectChatMessage +=`
                <p> ${selectedActor.data.name} maintient sa prise sur ${targetData.actor.data.name}.</p>
                `
        }
        else{
            effectChatMessage +=`
                <p> ${selectedActor.data.name} n'arrive pas à maintenir la prise. ${targetData.actor.data.name} se libère.</p>
                `
        }
    }
    else{
        let difficulty = targetData.resistValue - rollData.selectedAttribute.value + 10 - rollData.modifier;
        effectChatMessage =`
        <p> Difficulté = ${difficulty}</p> 
        `;      
        if(rolled.total <= difficulty){
            effectChatMessage +=`
                <p> ${targetData.actor.data.name} se libère de l'étreinte de ${selectedActor.data.name}.</p>
                `
        }
        else{
            effectChatMessage +=`
                <p> ${targetData.actor.data.name} reste étranglé par ${selectedActor.data.name}.</p>
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

<<<<<<< HEAD
function witchsight(selectedActor, Pwr, powerLvl, rollData) {
    // is there a target?
    let targets = Array.from(game.user.targets);
    let targetData;
    let isTargeted = false;
    if(targets.length != 0){
      isTargeted = true;
      try{targetData = getTarget("discreet")} catch(error){
=======
function witchsight(selectedActor, Pwr, PowerLvl, rollData) {
    // besoin d'une cible?
    let targetActor; 
    try{targetActor = getTarget()} catch(error){
        
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13
        throw error;
        };
        rollData.modifier = rollData.modifier - targetData.resistValue + 10;
    }
    let rolled = rollPwr(selectedActor, Pwr, powerLvl, rollData, targetData);
    rolled.toMessage();
    let effectChatMessage = "";

    if(rolled.total <= rollData.selectedAttribute.value + rollData.modifier){
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