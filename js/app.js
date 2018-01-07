new Vue({
  el: "#app",
  data: {
    gameStarted: false,
    gameOver: false,
    player: new Player(),
    monster: new Monster(),
    log: new Log(),
  },

  methods: {
    startGame: function() {
      this.gameStarted = true;
      this.gameOver = false;

      this.log.clear();

      this.player.prepareToPlay();
      this.monster.prepareToPlay();

      this.setPlayerTurn();
    },

    isTurn: function(name) {
      return this.turn.name.toLowerCase() == name.toLowerCase();
    },

    setPlayerTurn: function() {
      this.turn = this.player;
      this.player.prepareForTurn();
      this.monster.awaitOpponent();
    },

    setMonsterTurn: function() {
      this.turn = this.monster;
      this.player.awaitOpponent();
      this.monster.prepareForTurn();
    },

    playerAttacks: function(opts) {
      opts = Object.assign(
        {},
        {
          special: false,
          target: this.monster,
        },
        opts
      );

      var attack = generateAttack(opts);
      this.dispatchAttack(attack);

      this.log.write({
        actor: this.player,
        action: attack.name,
        amount: attack.amount,
      });

      this.setMonsterTurn();
      this.monsterAttacks({ special: opts.special });
    },

    monsterAttacks: function(opts) {
      var vm = this;

      setTimeout(function() {
        opts = Object.assign(
          {},
          {
            special: false,
            target: vm.player,
          },
          opts
        );

        var attack = generateAttack(opts);
        vm.dispatchAttack(attack);

        vm.log.write({
          actor: vm.monster,
          action: attack.name,
          amount: attack.amount,
        });

        vm.setPlayerTurn();
      }, 500);
    },

    playerHeals: function() {
      var healAmt = this.player.heal();

      this.log.write({
        actor: this.player,
        action: "healed",
        amount: healAmt,
      });

      this.setMonsterTurn();
      this.monsterAttacks();
    },

    dispatchAttack: function(attack) {
      if (attack.target.health - attack.amount <= 0) {
        attack.target.health = 0;
        this.endGame();
      } else {
        attack.target.health -= attack.amount;
      }
    },

    playerGivesUp: function() {
      this.player.giveUp();
      this.endGame();
    },

    endGame: function() {
      this.gameStarted = false;
      this.gameOver = true;
    },

    printWinnerName: function() {
      if (this.player.gaveUp)
        return this.monster.name;

      return this.player.weakerThan(this.monster) ?
        this.monster.name : this.player.name;
    },

    healthColor: function(health) {
      switch(true) {
        case (health > 65): return "green";
        case (health > 35): return "orange";
        case (health > 15): return "darkred";
        default: return "red";
      };
    },
  },
});

function Log() {
  this.entries = [];

  this.clear = function() {
    this.entries = [];
  };

  this.write = function(entry) {
    this.entries.unshift(entry);
  };
}

function generateAttack(opts) {
  var attack = {
    target: opts.target,
    _opts_special: opts.special,
  };

  attack.isSpecial = (function() {
    if (attack.target.isPlayer && attack._opts_special) {
      var idx = [Math.floor(Math.random()*2)],
          specialChance = [true, false];
      return specialChance[idx];
    } else {
      return attack._opts_special;
    }
  })();

  attack.amount = (function() {
    var maxDamage = 10;

    if (attack.isSpecial) {
      maxDamage = 15;
    }

    if (attack.target.isPlayer && attack.target.justHealed)
      maxDamage = 5;

    return Math.floor(
      Math.random() * Math.floor(maxDamage)
    );
  })();

  attack.name = (function() {
    if (attack.amount == 0) {
      return "missed";
    } else if (attack.isSpecial) {
      return "attacked with SPECIAL!";
    } else {
      return "attacked";
    }
  })();

  return attack;
}

function Player (){
  this.name = "Player";
  this.isPlayer = true;

  this.prepareToPlay = function() {
    this.health = 100;
    this.justHealed = false;
    this.gaveUp = false;
  };

  this.prepareForTurn = function() {
    this.isDeciding = true;
    this.justHealed = false;
  };

  this.awaitOpponent = function() {
    this.isDeciding = false;
  };

  this.heal = function() {
    var healAmt;

    if (this.health <= 90) {
      amt = Math.floor(Math.random() * Math.floor(10));
      healAmt = amt == 0 ? 5 : amt;
    } else {
      healAmt = 100 - this.health;
    }

    this.health += healAmt;
    this.justHealed = true;

    return healAmt;
  };

  this.giveUp = function() {
    this.gaveUp = true;
  };

  this.weakerThan = function(opponent) {
    return this.health < opponent.health;
  };
};

function Monster() {
  this.name = "Monster";
  this.isPlayer = false;

  this.prepareToPlay = function() {
    this.health = 100;
  };

  this.prepareForTurn = function() {
    this.isAttacking = true;
  };

  this.awaitOpponent = function() {
    this.isAttacking = false;
  };
}
