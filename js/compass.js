// ─── Stage Compass ────────────────────────────────────────────────────────────
// All 16 ñānas. Fully offline. The reference layer.

const COMPASS = (() => {

  const NANAS = [
    {
      num: 1,
      name: 'Mind & Body',
      pali: 'Nāmarūpa Pariccheda',
      section: 'pre-vipassana',
      feels: 'There\'s a new clarity about the difference between mental and physical processes. Thoughts feel different from sensations. The noting is working — you\'re tracking phenomena with more precision than before.',
      signs: ['Clear distinction between mental events and body sensations', 'Noting feels natural and productive', 'Concentration is building'],
      trap: 'Taking this clarity as the goal. Resting in the pleasantness of new attentiveness rather than pressing forward.',
      move: 'Keep the momentum going. The clarity you\'re experiencing is the beginning, not the destination. Note what\'s arising and move on. Don\'t let the noting become self-congratulatory.',
      ahead: 'The practice deepens into seeing causes — how mental states create physical sensations and vice versa.',
    },
    {
      num: 2,
      name: 'Cause & Effect',
      pali: 'Paccaya Pariggaha',
      section: 'pre-vipassana',
      feels: 'You\'re seeing the chain of events: a thought arises and the body responds, a sensation triggers a mental reaction. It\'s like watching dominoes fall in real time.',
      signs: ['Seeing mental and physical phenomena arising in pairs', 'Noticing how intention precedes movement', 'Sense of causality in experience'],
      trap: 'Getting fascinated with the mechanics — turning practice into intellectual observation rather than direct noting.',
      move: 'Note the cause and the effect, but don\'t stop to analyse them. Keep the noting pace up. The understanding is happening — let it happen through the noting itself, not around it.',
      ahead: 'The three characteristics of all phenomena begin to reveal themselves — impermanence, unsatisfactoriness, not-self.',
    },
    {
      num: 3,
      name: 'Three Characteristics',
      pali: 'Sammasana',
      section: 'pre-vipassana',
      feels: 'You\'re clearly seeing anicca, anatta, dukkha — intellectually, conceptually, but with increasing directness. The noting is sharp. Practice feels meaningful and productive.',
      signs: ['Clear intellectual understanding of impermanence, not-self, unsatisfactoriness', 'Strong concentration', 'Practice feels worthwhile and productive'],
      trap: 'Stopping at conceptual understanding. The three characteristics need to be seen directly, not just known about.',
      move: 'Note with the three characteristics as background knowledge but foreground attention. Don\'t think about impermanence — see the arising and passing. Don\'t think about not-self — see the lack of control. Keep noting. The A&P is close.',
      ahead: 'The A&P — the arising and passing event. One of the most significant experiences in the practice. It\'s coming.',
    },
    {
      num: 4,
      name: 'Arising & Passing',
      pali: 'Udayabbaya',
      section: 'ap',
      marker: '✦',
      feels: 'Something lit up. The sit went electric — bright, rapid phenomena, possibly lights or visual effects with eyes closed, possibly a sense of bliss or profound insight. The noting became effortless and fast. This was not an ordinary sit.',
      signs: ['Unusual brightness or electricity in the practice', 'Rapid arising and passing of phenomena', 'Possible lights or visual phenomena', 'Deep bliss or profound insight', 'Effortless noting at high speed', 'Sense of significance'],
      trap: 'Chasing it. Trying to hold onto the brightness. Expecting every sit to feel like this. The dissolution is coming — you cannot stop it and you should not try.',
      move: 'Don\'t chase it. Don\'t try to hold onto it. Note what\'s arising and let it pass. Know that the A&P has been crossed. Know that the dark night is coming. This is not a problem. It is the path.',
      ahead: 'Dissolution — things will begin to fall apart. The brightness will fade. This is completely normal and is the next stage of the path.',
    },
    {
      num: 5,
      name: 'Dissolution',
      pali: 'Bhaṅga',
      section: 'ap',
      feels: 'The brightness has gone. Objects are dissolving before they\'re fully formed. Noting is harder — phenomena are less defined, slippery. There\'s a sense of things falling apart.',
      signs: ['Objects dissolving before fully formed', 'Difficulty noting clearly', 'Sense of falling apart', 'The A&P brightness is gone', 'Practice feels less productive'],
      trap: 'Interpreting this as failure or regression. Thinking the good sits are over. Trying to get back to the A&P.',
      move: 'Keep noting. The dissolution is natural — you\'re seeing impermanence operating at a finer grain than before. Note what\'s there even if it\'s hazy. Stay with the noting. The dark night is approaching — keep momentum going into it.',
      ahead: 'The dark night — fear, heaviness, dread. It will feel like something has gone wrong. It hasn\'t.',
    },
    {
      num: 6,
      name: 'Fear',
      pali: 'Bhaya',
      section: 'dark-night',
      feels: 'Genuine existential dread. Not anxiety about your life — something more fundamental. A sense that something is wrong at the core of experience. Strong body sensations, often in chest or gut. The brightness has completely inverted.',
      signs: ['Existential dread', 'Sense that something is fundamentally wrong', 'Strong chest or gut sensations', 'Fear arising with nowhere clear to point it', 'Sits feel threatening rather than productive'],
      trap: 'Treating the fear as evidence that something has gone wrong with your practice or your mind. Stopping sitting to escape it.',
      move: 'Note the fear directly. Fear, fear. See it as impersonal phenomena. The mind is now close enough to the truth to be afraid of it. That fear is signal, not obstacle. Note the sensation in the chest. Note the dread. Nothing requires you to escape it.',
      ahead: 'Misery — a heavier, flatter quality. The fear gives way to something more grey.',
    },
    {
      num: 7,
      name: 'Misery',
      pali: 'Ādīnava',
      section: 'dark-night',
      feels: 'Heavy, grey, flat. Deep unpleasantness. Not sadness — something more fundamental. The mind has turned against experience. A sense of the inherent unsatisfactoriness of all conditioned phenomena.',
      signs: ['Heavy, grey, flat quality to experience', 'Deep unpleasantness', 'Mind turning against arising phenomena', 'Practice feels grinding rather than productive', 'Difficulty finding motivation'],
      trap: 'Aversion to the aversion. Adding a second layer of suffering by fighting what\'s here. Stopping practice because it feels too unpleasant.',
      move: 'Note with dispassion, not aversion to the aversion. Note the heaviness itself. Note the mind states. If noting is compounding the aversion, stop. Sit with metta for yourself for a few minutes. May I be at ease. May I be free from this suffering. Then return.',
      ahead: 'Disgust — the mind turns even more strongly against phenomena.',
    },
    {
      num: 8,
      name: 'Disgust',
      pali: 'Nibbidā',
      section: 'dark-night',
      feels: 'Aversion to the practice itself, to phenomena, sometimes to existence. A deep "no" to experience. The mind turns against everything that arises. Not just unpleasant — revolting.',
      signs: ['Aversion to sitting', 'Mind turning against all arising phenomena', 'Sense of disgust with experience', 'Possibly disgust with existence itself', 'Strong urge to stop practicing'],
      trap: 'Taking the disgust personally. Using it as a reason to stop. Or fighting it — trying to generate enthusiasm that isn\'t there.',
      move: 'Note the disgust itself. Disgust, disgust. See it as the mind\'s natural turning away from all conditioned phenomena — which is exactly what needs to happen on the path. This stage is not a problem, it\'s a move in the right direction. Jhāna as rest if you have access.',
      ahead: 'Desire for Deliverance — wanting out. The desire becomes explicit.',
    },
    {
      num: 9,
      name: 'Desire for Deliverance',
      pali: 'Muñcitukamyatā',
      section: 'dark-night',
      feels: 'Intense wanting out. The body wants it done. The mind has been saturated with suffering and is screaming for release. Chest heaviness. Cycling despair. The craving for enlightenment can become overwhelming.',
      signs: ['Intense wanting out', 'Craving for enlightenment or release', 'Chest heaviness', 'Cycling despair', 'Mind saturated with suffering', 'Sits feeling unbearable'],
      trap: 'Suppressing the craving (creates more craving) or pushing harder with more effort (pushes the path moment further away). Giving up entirely.',
      move: 'Note the wanting. Wanting, wanting. Desiring release, desiring release. Objectify the very wanting. When the wanting is fully seen as impersonal phenomena — not yours, not you — it becomes fuel, not obstacle. The craving for release is just more grist.',
      ahead: 'Re-observation — the cycling begins. You will think you\'re done with this territory. You are not. Not yet.',
    },
    {
      num: 10,
      name: 'Re-observation',
      pali: 'Paṭisaṅkhā',
      section: 'dark-night',
      feels: 'The wheel. Cycling back through the dukkha ñānas again. You thought you were done with this territory and here it is. Often with added discouragement — "this will never end." The recycling loop where serious practice careers end without guidance.',
      signs: ['Cycling back through dark night', 'Thought to be done with this territory', 'Added weight of discouragement', '"This will never end" thought', 'Cycling through multiple stages within single sits'],
      trap: 'Adding the meta-suffering of discouragement to what\'s already here. Giving up. Alternatively: pushing harder, creating more craving.',
      move: 'Maximum dispassion. Do not add the weight of discouragement to what\'s already here. Don\'t. Just note. Note the discouragement too. Note the frustration at being back here. Everything gets noted. The wheel stops when you stop pushing it. Keep the momentum going and do not stop.',
      ahead: 'Equanimity — the dark night lifts. Vast, open, still. But this is the launch pad, not the destination.',
    },
    {
      num: 11,
      name: 'Equanimity toward Formations',
      pali: 'Saṅkhārupekkhā',
      section: 'launchpad',
      feels: 'Vast. Open. Still. The mind is panoramic. Nothing is pulling you anywhere. The suffering has lifted. Practice is effortless. Clear. Concentrated. This feels like arrival. It is not.',
      signs: ['Vast, open, panoramic quality', 'Stillness', 'Nothing pulling anywhere', 'Effortless practice', 'Suffering has lifted', 'Sense of arrival or peace'],
      trap: 'Mistaking this peace for arrival. Resting here. Stopping the investigation. Sitting in the equanimity without pressing forward. This turns the launch pad into a plateau.',
      move: 'Keep noting. Note the spaciousness itself. Note the stillness. Note the sense of everything being fine. The formations are still arising and passing. The illusion of self is still being constructed every moment. See it. Keep peeling back the layers. The blinking in and out of the sense of "I" — notice that. Note it directly. You are very close.',
      ahead: 'Conformity, change of lineage, path. The escape velocity sequence. You are on the launch pad.',
    },
    {
      num: 12,
      name: 'Conformity',
      pali: 'Anuloma',
      section: 'escape',
      feels: 'Rapid alignment. Things speeding up. The three characteristics are being seen with unusual clarity and speed. Practice is moving fast.',
      signs: ['Rapid arising and passing', 'Three characteristics seen with unusual clarity', 'Sense of momentum or acceleration', 'Practice feels unusually precise'],
      trap: 'Grasping or excitement. The path moment requires letting go, not holding on.',
      move: 'Keep noting. Everything that arises, note it. Keep the momentum. Don\'t grasp at what\'s happening. Let it move through.',
      ahead: 'Change of lineage — the threshold.',
    },
    {
      num: 13,
      name: 'Change of Lineage',
      pali: 'Gotrabhū',
      section: 'escape',
      feels: 'The transition moment. A sense of crossing into different territory. This is the last moment before the path moment itself.',
      signs: ['Transition quality', 'Shift in the quality of attention', 'Something is about to happen'],
      trap: 'Grasping or reacting. Any reaction will interrupt it.',
      move: 'Stay equanimous. Let it happen. Don\'t grasp, don\'t push, don\'t react. The path moment occurs when the mind lets go completely.',
      ahead: 'Path — stream entry.',
    },
    {
      num: 14,
      name: 'Path',
      pali: 'Magga',
      section: 'escape',
      marker: '✦',
      feels: 'Stream entry. The path moment. A cessation or blink-out — a moment of no-experience — followed by the mind re-emerging. The quality of mind is changed. Something has shifted permanently. Often described as an opening, a clearing, a sense that something solid has fallen away.',
      signs: ['Cessation or blink-out moment', 'Sense of something shifting permanently', 'Changed quality of mind afterwards', 'Possible bliss or openness following', 'The mind feels different'],
      trap: 'Looking for spectacle. The path moment is often quiet and can feel like an anticlimax. The change is in the after, not in the moment itself.',
      move: 'After the path moment: rest. Let the mind settle. Don\'t immediately try to repeat it. The cycling will begin soon — you are now on a different track.',
      ahead: 'Fruition — cessation. Cycling begins from the A&P. A new map for post-path practice.',
    },
    {
      num: 15,
      name: 'Fruition',
      pali: 'Phala',
      section: 'escape',
      feels: 'Cessation. The mind shuts down for a moment — nothing is experienced during the cessation itself, only the moments before and after. Often followed by a bliss wave 2–3 seconds later. With practice, fruitions become accessible on will.',
      signs: ['Cessation moments (conk-outs)', 'Bliss waves following cessation', 'Cycling fruitions', 'Ability to access cessation deliberately'],
      trap: 'Getting attached to fruitions. Using them for bliss rather than as markers of where the mind is.',
      move: 'Continue the practice. Use the post-fruition bliss wave for metta if you have the inclination. Note what\'s arising. The review period follows naturally.',
      ahead: 'Review — the mind processes what has occurred. Then cycling restarts from the A&P.',
    },
    {
      num: 16,
      name: 'Review',
      pali: 'Paccavekkhaṇā',
      section: 'escape',
      feels: 'The mind reviews what has occurred. Often spontaneous — the path moment replays, is re-experienced, is processed. A natural review period.',
      signs: ['Spontaneous review of the path moment', 'Mind processing and integrating what occurred', 'New baseline becoming clearer'],
      trap: 'Over-analysing or trying to describe the experience. The path is not in the description of it.',
      move: 'Let the review happen naturally. Note what arises. Return to practice when the mind is ready. The cycling has already begun — notice that.',
      ahead: 'Cycling from A&P to Fruition begins. For 2nd path: eventually the full insight cycle starts again from ñāna 1.',
    },
  ];

  const SECTIONS = {
    'pre-vipassana': { label: 'Pre-Vipassana Territory  1–3', class: '' },
    'ap':            { label: 'The A&P and Dissolution  4–5', class: 'amber' },
    'dark-night':    { label: 'The Dark Night  6–10', class: 'danger' },
    'launchpad':     { label: 'The Launch Pad  11', class: 'amber' },
    'escape':        { label: 'Escape Velocity  12–16', class: 'amber' },
  };

  // ── Render the map ─────────────────────────────────────────────────────────
  function renderMap(container, onSelect) {
    container.innerHTML = '';
    let currentSection = null;

    NANAS.forEach(nana => {
      if (nana.section !== currentSection) {
        currentSection = nana.section;
        const sec = SECTIONS[currentSection];
        const label = document.createElement('div');
        label.className = 'nana-section-label';
        label.textContent = sec.label;
        container.appendChild(label);
      }

      const btn = document.createElement('button');
      btn.className = 'nana-btn' + (nana.section === 'dark-night' ? ' dark-night' : '');
      btn.innerHTML = `
        <span class="nana-num">${nana.num}</span>
        <span class="nana-name">${nana.name}</span>
        ${nana.marker ? `<span class="nana-marker">${nana.marker}</span>` : ''}
      `;
      btn.addEventListener('click', () => onSelect(nana));
      container.appendChild(btn);
    });
  }

  // ── Render detail ──────────────────────────────────────────────────────────
  function renderDetail(container, nana) {
    container.innerHTML = `
      <div class="compass-detail-inner">
        <div>
          <div class="compass-detail-title">${nana.num}. ${nana.name}</div>
          <div class="compass-detail-pali">${nana.pali}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-label">What it feels like</div>
          <div class="detail-section-body">${nana.feels}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-label">Characteristic signs</div>
          <div class="detail-section-body">${nana.signs.map(s => '— ' + s).join('<br>')}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-label">The trap</div>
          <div class="detail-section-body trap">${nana.trap}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-label">The move</div>
          <div class="detail-section-body move">${nana.move}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-label">What's ahead</div>
          <div class="detail-section-body">${nana.ahead}</div>
        </div>
      </div>
    `;
  }

  function getByNum(num) {
    return NANAS.find(n => n.num === num);
  }

  function getAll() {
    return NANAS;
  }

  return { renderMap, renderDetail, getByNum, getAll, NANAS };
})();
