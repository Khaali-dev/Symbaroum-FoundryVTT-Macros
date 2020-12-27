main()

async function main(){
  // get selected token and Actor
  let selected = canvas.tokens.controlled;
  if(selected.length == 0 || selected.length > 1){
    ui.notifications.error("Sélectionnez le token qui attaque, et uniquement ce token")
    return;
  }
  let selectedActor = selected[0].actor;

  //check wether acting token is player controlled
  let attackFromPC = selectedActor.hasPlayerOwner;
  let targetData;

  // get target token, actor and defense value
  try{targetData = getTarget()} catch(error){      
    ui.notifications.error(error);
    return;
  }
  // Recherche tous les items de type weapon appartenant à selectedActor
  let actorWeapons = selectedActor.items.filter(item => item.data?.type == "weapon")
  if(actorWeapons.length == 0){
    ui.notifications.error("Le personnage selectionné n'a aucune arme en main.");
    return;
  }

  //search for special attacks
  let backstabAbil = selectedActor.items.filter(item => (item.data.name === "Coup en traître"));
  let hasBackstab = false;
  if(backstabAbil.length != 0){
    hasBackstab = true;
  }
  let hunterInstinct = selectedActor.items.filter(item => (item.data.name === "Instinct du chasseur"));
  let hasHunterI = false;
  if(hunterInstinct.length != 0){
    hasHunterI = true;
  }

  let htmlTemplate = await renderTemplate("worlds/Shared_data/Templates/dialog-combat.html",{
    weapons : actorWeapons, hasBackstab: hasBackstab, isFullDisplay : false });

  new Dialog({
    title: "Jet d'attaque", 
    content: htmlTemplate,
    buttons: {
      rollAtk: {
        label: "Jet d'attaque",
        callback: (html) => {
            // recupere les éléments selectionnés par le joueur dans la fenetre html et les transforme en variables propres
          let wepID = html.find("#weapon")[0].value;
          console.log(wepID);
          let wep = selectedActor.items.find(item => item.id == wepID);
          const attckAttributeName = wep.data.data.attribute;
          console.log(wep);
          let useBackstab = false;
          if(hasBackstab){
            useBackstab = html.find("#useBckstb")[0].checked;
          }
          let rollData = {
            selectedToken : selected[0],
            selectedAttribute : selectedActor.data.data.attributes[attckAttributeName],
            modifier : Number(html.find("#modAtk")[0].value),
            hasAdvantage : html.find("#avntg")[0].checked,
            selectedCursed : false,
            use2kl : false
          };
          console.log(rollData);
          let dmgData = {
            modifier : html.find("#modDam")[0].value,
            hasAdvantage : html.find("#avntg")[0].checked,
            ignoreArm : html.find("#ign")[0].checked,
            useBackstab : useBackstab
          }
          console.log(dmgData);

          let poisonStrenght = Number(html.find("#poison")[0].value);
          console.log(poisonStrenght);
          let specialA;
          (async () => {
            let rangedData = await checkRanged(wep, targetData, hunterInstinct);
            if(rangedData.hunterIToHit){
              rollData.use2kl = true;
            }
            specialA = await specialAttack(attackFromPC, selectedActor, wep, rollData, targetData, dmgData);
            if(!specialA){

              let touche = attackRoll(attackFromPC, selectedActor, wep, rollData, targetData, rangedData);
              console.log("touche");
              console.log(touche);
              let chatTemplate = "";
              if(touche){
                let damageResult;
                  damageResult = await damageRoll(attackFromPC, selectedActor, wep, dmgData, targetData, rangedData);
                //poison effect
                if(poisonStrenght > 0 && !damageResult.targetDies && damageResult.dmgTot > 0){
                  poisonUsed(attackFromPC, selectedActor, poisonStrenght, targetData);
                }
                if(targetData.actor.data.data.health.toughness.value <= 0){
                  chatTemplate += `
                  <p> ${targetData.actor.data.name} est mortellement touché et s'éffondre.</p>
                  `;
                }
                else if(damageRoll.dmgTot >= targetData.actor.data.data.health.toughness.threshold){
                  chatTemplate += `
                  <p> ${targetData.actor.data.name} est sonné, et doit choisir entre tomber à terre, ou s'exposer à une attaque gratuite de ${selectedActor.data.name}</p>
                  `;
                };
              }
              else {
                // attaque ratée
                chatTemplate += `
                <p> ${selectedActor.data.name} manque ${targetData.actor.data.name}</p>
                `;
            }
            if(chatTemplate != ""){
              ChatMessage.create({
                  speaker: {
                    alias: selectedActor.name
                  },
                  content: chatTemplate
              })
            }
          }
        })()
        }
      }, 
      close: {
        label: "Close"
      }
    }
  }).render(true)
}

// function for rolling the main attribute test. 
function rollSymb(selectedActor, rollData, targetData) {

  //roll 1d20
  let rollP;

  // check who makes the roll : if a PC is a target in opposition, it's the PC who makes the roll
  //check statuses and bonuses that will have the player roll 2 dices, and keep the highest or lowest


///verifier qui fait le jet: selected ou target?
  let selectedRolls = true;
  let resistValue = 0;
  let targetCursed = false;
  let use2kl = rollData.use2kl;
  let selectedCursed = rollData.selectedCursed;
  if(targetData != undefined){
      resistValue = targetData.resistValue;
      targetCursed = targetData.cursed;
  }


  if(resistValue != 0){
      if((!selectedActor.hasPlayerOwner)  && targetData.actor.hasPlayerOwner)
      {
          selectedRolls = false;
      }
  }

  if(rollData.use2kl && selectedCursed){
    selectedCursed = false;
    use2kl = false;
  }

  if(selectedRolls){
      if(resistValue != 0){
          if(selectedCursed){
              if(targetCursed){
                  rollP = new Roll("1d20").evaluate();
              }
              else{
                  rollP = new Roll("2d20kh").evaluate();
              }  
          }
          else if(use2kl){
            rollP = new Roll("2d20kl").evaluate();
          }
          else if(targetCursed){
              rollP = new Roll("2d20kl").evaluate();
          }
          else{
              rollP = new Roll("1d20").evaluate();
          }
      }
      else if(selectedCursed){
          rollP = new Roll("2d20kh").evaluate();
      }
      else if(use2kl){
        rollP = new Roll("2d20kl").evaluate();
      }
      else{
          rollP = new Roll("1d20").evaluate();
      }
  }
  else{
      if(targetCursed){
          if(selectedCursed){
              rollP = new Roll("1d20").evaluate();
          }
          else{
              rollP = new Roll("2d20kh").evaluate();
          }  
      }
      else if(selectedCursed){
          rollP = new Roll("2d20kl").evaluate();
      }
      else if(use2kl){
        rollP = new Roll("2d20kh").evaluate();
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

function getTarget() {
  let targets = Array.from(game.user.targets)  // targets renvoie un ensemble, on le transforme en tableau avec array.from
  if(targets.length == 0 || targets.length > 1 ){
    throw "Choisissez une (seule) cible";
  }
  let targetToken = targets[0];

  // target status effects
  let targetCursed = false;
  const CursedEffect = "icons/svg/sun.svg";
  let cursedEffectCounter = EffectCounter.findCounter(targetToken, CursedEffect);
  if(cursedEffectCounter != undefined){
      targetCursed = true;
  };
  let leaderTarget = false;
  const LeaderEffect = "icons/svg/eye.svg";
  let leaderEffectCounter = EffectCounter.findCounter(targetToken, LeaderEffect);
  if(leaderEffectCounter != undefined){
    leaderTarget = true;
  };

  return{
    token : targets[0],
    actor : targets[0].actor,
    resistValue : targets[0].actor.data.data.combat.defense,
    cursed : targetCursed,
    leaderTarget : leaderTarget
  }
}

function attackRoll(attackFromPC, selectedActor, wep, rollData, targetData, rangedData){
  // is the actor cursed?
  const CursedEffect = "icons/svg/sun.svg";
  let cursedEffectCounter = EffectCounter.findCounter(rollData.selectedToken, CursedEffect);
  if(cursedEffectCounter != undefined){
    rollData.selectedCursed = true;
  };

  let rolled = rollSymb(selectedActor, rollData, targetData);
  let chatAttack = ``;
  if (attackFromPC){
    chatAttack += `
    <p> </p>
    <p> ${selectedActor.data.name} attaque ${targetData.actor.data.name}.</p>
    <p> Jet sous l'attribut d'attaque (${rollData.selectedAttribute.value}) modifié par la défense.</p>
    `;
  }
  else{
    chatAttack += `
    <p> </p>
    <p> ${targetData.actor.data.name} essaie de se défendre contre l'attaque de ${selectedActor.data.name}.</p>
    <p> Jet de défense (${targetData.resistValue}) modifiée par l'attaque.</p>
    `;
  }
  chatAttack += `
  <p> modificateurs: `;

  if(rollData.modifier !=0){
    chatAttack += `[modificateur manuel ${rollData.modifier}] `;
  }

  if(rollData.hasAdvantage){
    rollData.modifier += 2;
    chatAttack += `[attaquant avantagé] `;
  }
  if(wep.data.data.qualities.precise){
    rollData.modifier += 1;
    chatAttack += `[arme précise] `;
  };
  if(targetData.cursed){
    chatAttack += `[défenseur maudit] `;
  }
  if(rollData.selectedCursed){
    chatAttack += `[attaquant maudit] `;
  }
  if(rangedData.hunterIToHit){
    chatAttack += `[marque du chasseur] `;
  }
  chatAttack += `</p>`;

  let touche = false;
  if(attackFromPC){
    rollData.modifier += 10 - targetData.resistValue;
    if(rolled.result <= rollData.selectedAttribute.value + rollData.modifier){
      touche = true;
      chatAttack += `<p>${selectedActor.data.name} touche ${targetData.actor.data.name}.</p>`;
    }
  }
  else{
    rollData.modifier += rollData.selectedAttribute.value - 10;
    if(rolled.result <= targetData.resistValue - rollData.modifier){
      chatAttack += `<p>${targetData.actor.data.name} esquive ou pare l'attaque de ${selectedActor.data.name}.</p>`;
    }
    else{  
      touche = true;        
      chatAttack += `<p>${targetData.actor.data.name} est touché!</p>`;
    }
  }
  ChatMessage.create({
    speaker: {
      alias: selectedActor.name
    },
    content: chatAttack
  })
  return(touche)
}

async function damageRoll(attackFromPC, selectedActor, wep, dmgData, targetData, rangedData){
  let chatAttack = ``;
  let newRollDmgString = "";
  let wepDmg = wep.data.data.damage;
  let modDmg = 0;
  let armorProt = targetData.actor.data.data.combat.protection;   

  chatAttack += `
  <p> Modificateurs aux dommages: `;
  if(dmgData.isRanged){

  }

  if(dmgData.modifier != "0"){
    chatAttack += `[modificateur manuel ${dmgData.modifier}] `;
  }

  if(dmgData.hasAdvantage){
    if(dmgData.useBackstab){
      dmgData.modifier += " + 2d4";
    chatAttack += `[attaquant avantagé et coup en traître] `;
    }
    else
    {
      dmgData.modifier += " + 1d4";
      chatAttack += `[attaquant avantagé] `;
    }
  }
  if(targetData.leaderTarget){
    dmgData.modifier += " + 1d4";
    chatAttack += `[cible Meneur né] `;
  }
  if(wep.data.data.qualities.deepImpact){
    modDmg = modDmg + 1;
    chatAttack += `[arme éventreur] `;
  }
  if(dmgData.ignoreArm){
    chatAttack += `[attaque ignore l'armure] `;
  }
  if(rangedData.hunterIDmg){
    dmgData.modifier += " + 1d4";
    chatAttack += `[marque du chasseur] `;
  }
  chatAttack += `</p>`;
  // calcul du jet de dommage si l'attaquant est dirigé par un Joueur
  if(attackFromPC){
    // calcul de l'armure du PNJ
    let armorRoll= new Roll(armorProt).evaluate({maximize: true});
    let armorValue = Math.ceil(armorRoll.total/2);

    //fabrication du pool
    newRollDmgString = wepDmg + " + " + dmgData.modifier + " + " + modDmg;
    if(!dmgData.ignoreArm){
      newRollDmgString += " - " + armorValue;
    }
  }
  else{
    // calcul du jet de dommage si l'attaquant est un PNJ
    wepDmg += " + " + dmgData.modifier;
    let weaponRoll= new Roll(wepDmg).evaluate({maximize: true});
    let weaponDmgValue = Math.ceil(weaponRoll.total/2);

    //fabrication du pool
    newRollDmgString = weaponDmgValue + " + " + `${modDmg}`; 
    if(!dmgData.ignoreArm){
      newRollDmgString += " - " + armorProt;
    }
  }
  // calcul des dégats
  let dmgRoll= new Roll(newRollDmgString).evaluate();
  
  await dmgRoll.toMessage();
  let dmgTot = Math.max(dmgRoll.total, 0);
  let dmgdetail = dmgRoll.result;
  let targetDies = false;
          
<<<<<<< HEAD
  if(targetData.actor.data.data.health.toughness.value - dmgTot <= 0){
      dmgTot = targetData.actor.data.data.health.toughness.value;
      targetDies = true;
  }
  if(!attackFromPC){
    await targetData.actor.update({"data.health.toughness.value" : targetData.actor.data.data.health.toughness.value - dmgTot});
    await targetData.token.drawBars();
    if(targetDies){
      const skullEffect = "icons/svg/skull.svg";
      let deathEffect = new EffectCounter(1, skullEffect, targetData.token, false);
      deathEffect.update();
    }
  }
  chatAttack += `
  <p> ${targetData.actor.data.name} reçoit ${dmgTot} points de dégâts. </p>
  `;
  ChatMessage.create({
    speaker: {
      alias: selectedActor.name
    },
    content: chatAttack
  })
  return{
    targetDies : targetDies,
    dmgTot : dmgTot
  }
}

async function poisonUsed(attackFromPC, selectedActor, poisonStrenght, targetData){
  
  let poisonDamage = "0";
  let poisonRounds = "0";
  let alreadyPoisoned = false;
  let poisonedTimeLeft = 0;
  let chatAttack = "";
  const effect = "icons/svg/poison.svg";
  switch (poisonStrenght){
    case 1:
      if(attackFromPC){
        poisonDamage = "1d4";
        poisonRounds = "1d4";
      }
      else{
        poisonDamage = "2";
        poisonRounds = "2";
      };
      break;
    case 2:
      if(attackFromPC){
        poisonDamage = "1d6";
        poisonRounds = "1d6";
      }
      else{
        poisonDamage = "3";
        poisonRounds = "3";
      };
      break;
    case 3:
      if(attackFromPC){
        poisonDamage = "1d8";
        poisonRounds = "1d8";
      }
      else{
        poisonDamage = "4";
        poisonRounds = "4";
      };
      break;
  }
=======
            let dmgRoll= new Roll(newRollDmgString).evaluate();
            let dmgTot = Math.max(dmgRoll.total, 0);
            let dmgdetail = dmgRoll.result;
            console.log(wepDmg);
            console.log(dmgTot);
            console.log(dmgdetail);
            targetActor.data.data.health.toughness.value = targetActor.data.data.health.toughness.value - dmgTot;
            let targetDies = false;
            if(targetActor.data.data.health.toughness.value <= 0){
              targetActor.data.data.health.toughness.value = 0;
              targetDies = true;
              const skullEffect = "icons/svg/skull.svg";
              targetToken.toggleEffect(skullEffect);
            }

            chatTemplate += `
            <p> Total du jet d'attaque : ${detail} = ${result} réussi sous votre attribut (${targetVal})</p>
            <p> ${selectedActor.data.name} touche ${targetActor.data.name}</p>
            <p> Dégats : ${dmgTot} </p>
            <p> Décomposition des Dégats : ${dmgdetail} </p>
            `;

            let poisonDamage = "0";
            let poisonRounds = "0";
            let alreadyPoisoned = false;
            let poisonedTimeLeft = 0;

            //poison effect
            if(poisonStrenght > 0 && !targetDies && dmgTot > 0){
              const effect = "icons/svg/poison.svg";
              

              switch (poisonStrenght) {
                case "1":
                  if(AttaquantPC){
                    poisonDamage = "1d4";
                    poisonRounds = "1d4";
                  }
                  else{
                    poisonDamage = "2";
                    poisonRounds = "2";
                  };
                  break;
                case "2":
                  if(AttaquantPC){
                    poisonDamage = "1d6";
                    poisonRounds = "1d6";
                  }
                  else{
                    poisonDamage = "3";
                    poisonRounds = "3";
                  };
                  break;
                case "3":
                  if(AttaquantPC){
                    poisonDamage = "1d8";
                    poisonRounds = "1d8";
                  }
                  else{
                    poisonDamage = "4";
                    poisonRounds = "4";
                  };
                  break;
                }

                let poisonedEffectCounter = EffectCounter.findCounter(targetToken, effect);
  
              
                if(poisonedEffectCounter != undefined){
                  //target already poisoned
                  alreadyPoisoned = true;
                  //get the number of rounds left
                  poisonedTimeLeft = EffectCounter.findCounterValue(targetToken, effect);
                  console.log(poisonedTimeLeft);

                  let PoisonRoundsRoll= new Roll(poisonRounds).evaluate();

                  chatTemplate += `
                  <p> ${targetActor.data.name} était déjà empoisonné pour ${poisonedTimeLeft} rounds</p>
                  `;

                  let NewPoisonRounds = PoisonRoundsRoll.total;
>>>>>>> 851a793ce97c380f21bf7f91b39bfa1be6e0ed13

    let poisonedEffectCounter = await EffectCounter.findCounter(targetData.token, effect);
    if(poisonedEffectCounter != undefined){
      //target already poisoned
      alreadyPoisoned = true;
      //get the number of rounds left
      poisonedTimeLeft = await EffectCounter.findCounterValue(targetData.token, effect);
      console.log(poisonedTimeLeft);

      let PoisonRoundsRoll= new Roll(poisonRounds).evaluate();

      chatAttack += `
      <p> ${targetData.actor.data.name} était déjà empoisonné pour ${poisonedTimeLeft} rounds</p>
      `;

      let NewPoisonRounds = PoisonRoundsRoll.total;

      if(NewPoisonRounds > poisonedTimeLeft){
        if(!attackFromPC){
          poisonedEffectCounter.setValue(NewPoisonRounds,targetData.token, false);
          poisonedEffectCounter.update();
        }
        chatAttack += `
        <p> La durée du poison est prolongée, l'effet durera encore ${NewPoisonRounds} rounds</p>
        `;
      }
      else{
        chatAttack += `
        <p> La durée du poison reste inchangée</p>
        `;
      }
    }
    else{
      //nouvel empoisonnement
      let poisonRoundsRoll= new Roll(poisonRounds).evaluate();
      poisonedTimeLeft = poisonRoundsRoll.total;

      if(!attackFromPC){
        let poisonedEffect = new EffectCounter(poisonedTimeLeft, effect, targetData.token, false);
        poisonedEffect.update();
      }
      chatAttack += `
      <p> ${targetData.actor.data.name} est empoisonné, et recevra ${poisonDamage} dégâts pendant ${poisonedTimeLeft} rounds</p>
      <p> ${targetData.actor.data.name} commencera à prendre les dommages lors de sa prochaine action (à faire à la main!)</p>
      `;
    };
    ChatMessage.create({
      speaker: {
        alias: selectedActor.name
      },
      content: chatAttack
    })
}

async function specialAttack(attackFromPC, selectedActor, wep, rollData, targetData, dmgData){
  if(wep.data.name === "Garrot"){
    let actorAbilities = selectedActor.items.filter(item => item.data?.isAbility);
    let stranglerAbil = actorAbilities.filter(item => (item.data.name == "Étrangleur"))
    if(stranglerAbil == undefined){
      ui.notifications.error("Il faut le talent étrangleur pour utiliser correctement un garrot");
    return(true);
    }
    if(!rollData.hasAdvantage){
      ui.notifications.error("Vous devez avoir l'avantage pour utiliser un garrot");
      return(true);
    }
    return(await strangler(attackFromPC, selectedActor, wep, rollData, targetData, dmgData))
  }
  else{
    console.log("here");
    return(false);
  }
}

async function strangler(attackFromPC, selectedActor, wep, rollData, targetData, dmgData){
     //I suppress the advantage bonus for the strangler roll
    rollData.hasAdvantage = false;
    dmgData.hasAdvantage = false;
    let touche = attackRoll(attackFromPC, selectedActor, wep, rollData, targetData);
    let chatTemplate = "";
    if(touche){
      dmgData.ignoreArm = true;

      let damageResult = await damageRoll(attackFromPC, selectedActor, wep, dmgData, targetData);
       
      if(targetData.actor.data.data.health.toughness.value <= 0){
        chatTemplate += `
        <p> ${targetData.actor.data.name} est mortellement touché et s'éffondre.</p>
        `;
      }
      else{
        chatTemplate += `
        <p> ${selectedActor.data.name} saisit ${targetData.actor.data.name} et commence à l'étrangler.</p>
        `;
      }
    }
    else {
        // attaque ratée
        chatTemplate += `
        <p> ${selectedActor.data.name} ne parvient pas à maitriser ${targetData.actor.data.name}</p>
        `;
    }
    if(chatTemplate != ""){
      ChatMessage.create({
          speaker: {
            alias: selectedActor.name
          },
          content: chatTemplate
      })
    }
    return(true)
}

async function checkRanged(wep, targetData, hunterInstinct){
  let isRanged = false
  if((wep.data.name == "Arbalète")||
  (wep.data.name == "Arc long")||
  (wep.data.name == "Arc standard")||
  (wep.data.name == "Couteau de lancer")||
  (wep.data.name == "Fronde")){
     isRanged = true;
  }
  console.log(isRanged);
  let hunterIToHit = false;
  let hunterIDmg = false;
  if(isRanged && (hunterInstinct.length != 0)){
    const effect = "icons/svg/target.svg";
    let targetEffectCounter = await EffectCounter.findCounter(targetData.token, effect);
    if(targetEffectCounter != undefined){
      hunterIToHit = true;
      if(hunterInstinct[0].data.data.adept.isActive){
        hunterIDmg = true;
      }
    }
  }
  return({isRanged: isRanged,
    hunterIToHit: hunterIToHit,
    hunterIDmg: hunterIDmg})
}