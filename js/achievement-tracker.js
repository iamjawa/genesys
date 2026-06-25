/**
 * GENESYS — Achievement Tracker
 * Tracks milestone achievements based on store and discovery state.
 */

function AchievementTracker(store, tracker) {
  this.store = store;
  this.tracker = tracker;
}

var ACHIEVEMENTS = [
  {
    id: 'collector_10',
    name: 'Collector',
    desc: 'Own 10 organisms',
    check: function(store) { return store.getCount() >= 10; },
  },
  {
    id: 'collector_20',
    name: 'Master Collector',
    desc: 'Own 20 organisms',
    check: function(store) { return store.getCount() >= 20; },
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    desc: 'Discover all 5 colors',
    check: function(store, tracker) {
      var d = tracker.getDiscovered();
      return d.color.hasOwnProperty('R') && d.color.hasOwnProperty('W') &&
             d.color.hasOwnProperty('G') && d.color.hasOwnProperty('B') &&
             d.color.hasOwnProperty('P');
    },
  },
  {
    id: 'pattern_seeker',
    name: 'Pattern Seeker',
    desc: 'Discover all patterns',
    check: function(store, tracker) {
      var d = tracker.getDiscovered();
      return d.pattern.hasOwnProperty('S') && d.pattern.hasOwnProperty('T') &&
             d.pattern.hasOwnProperty('D') && d.pattern.hasOwnProperty('C');
    },
  },
  {
    id: 'sculptor',
    name: 'Sculptor',
    desc: 'Discover all shapes',
    check: function(store, tracker) {
      var d = tracker.getDiscovered();
      return d.shape.hasOwnProperty('O') && d.shape.hasOwnProperty('P') &&
             d.shape.hasOwnProperty('H') && d.shape.hasOwnProperty('S');
    },
  },
  {
    id: 'legendary',
    name: 'Legendary!',
    desc: 'Create a Legendary organism',
    check: function(store) {
      var all = store.getAll();
      for (var i = 0; i < all.length; i++) {
        if (all[i].rarityLabel === 'Legendary') return true;
      }
      return false;
    },
  },
  {
    id: 'veteran',
    name: 'Veteran',
    desc: 'Reach generation 5',
    check: function(store) { return store.getMaxGeneration() >= 5; },
  },
  {
    id: 'completionist',
    name: 'Completionist',
    desc: 'Discover every allele',
    check: function(store, tracker) {
      var all = tracker.getAll();
      return all.total > 0 && all.seen === all.total;
    },
  },
];

AchievementTracker.prototype.getAll = function() {
  return ACHIEVEMENTS.map(function(a) {
    return {
      id: a.id,
      name: a.name,
      desc: a.desc,
      completed: a.check(this.store, this.tracker),
    };
  }, this);
};

AchievementTracker.prototype.getCompleted = function() {
  return this.getAll().filter(function(a) { return a.completed; });
};

AchievementTracker.prototype.getUncompleted = function() {
  return this.getAll().filter(function(a) { return !a.completed; });
};

AchievementTracker.prototype.checkNew = function(prevCompleted) {
  var now = this.getAll();
  var newly = [];
  for (var i = 0; i < now.length; i++) {
    if (now[i].completed && prevCompleted.indexOf(now[i].id) === -1) {
      newly.push(now[i]);
    }
  }
  return newly;
};
