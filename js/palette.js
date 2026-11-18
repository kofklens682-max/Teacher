'use strict';
/* NEXT (16 Nov, user): ONLY seven colours in the whole app — blue, green, orange, purple, pink, red, yellow (iPhone colours, a little
   brighter). Teacher's own colour is blue. Every colour table of the app is pointed at these seven. */
const P7 = { blue: ['#007AFF', '#007AFF'], green: ['#34C759', '#34C759'], orange: ['#FF9500', '#FF9500'], purple: ['#AF52DE', '#AF52DE'], pink: ['#FF2D55', '#FF2D55'], red: ['#FF3B30', '#FF3B30'], yellow: ['#FFCC00', '#FFCC00'] };
const P7L = Object.values(P7);
// levels: each level one of the seven
Object.assign(GRAD, { A1: P7.green, A2: P7.blue, B1: P7.purple, 'B1+': P7.pink, B2: P7.orange, I1: P7.red, I2: P7.red, IT: P7.pink, K2: P7.orange, K3: P7.green, K4: P7.blue, K5: P7.purple, RU: P7.yellow, own: P7.yellow });
// the week tiles (pairs of colours, in turn)
TOPIC.splice(0, TOPIC.length, ...P7L.flat());
// the colours you can choose for a group
Object.assign(COLORS, { red: P7.red, orange: P7.orange, yellow: P7.yellow, green: P7.green, teal: P7.green, sky: P7.blue, blue: P7.blue, purple: P7.purple, pink: P7.pink, slate: P7.blue });
AVC.splice(0, AVC.length, ...P7L.map((p) => p[1]));
Object.assign(STC, { paid: P7.green[1], credit: P7.blue[1], part: P7.orange[1], unpaid: P7.red[1] });
