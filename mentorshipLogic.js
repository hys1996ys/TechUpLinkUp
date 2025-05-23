// mentorshipLogic.js

// Renders a mentor or mentee profile card with badges, name, designation, and a match score bar if isPending = true.
function renderCard(profile, score, isPending = false) {
  const initials = profile?.name?.charAt(0)?.toUpperCase() || 'U';
  const skills = (profile.skills || []).map(skill => `<span class="badge">${skill}</span>`).join('');
  const goals = (profile.learning_goals || profile.learning_style || []).map(g => `<span class="badge">${g}</span>`).join('');
  const matchBar = isPending
    ? `<div class="compat-label">${score}% Match</div><div class="compat-bar"><div class="compat-fill" style="width: ${score}%;"></div></div>`
    : '';
  const actionBtn = isPending
    ? `<button class="btn btn-success full-width" onclick="acceptMentee('${profile.id}')">Accept</button>`
    : `<button class="btn full-width"><i class="fa fa-eye"></i> View Profile</button>`;

  return `
    <div class="mentee-card">
      <div class="avatar-circle-sm">${initials}</div>
      <h3>${profile.name}</h3>
      <p>${profile.designation || ''}</p>
      ${matchBar}
      <strong>Learning Goals</strong>
      <div class="badge-group">${goals}</div>
      <strong>Skills</strong>
      <div class="badge-group">${skills}</div>
      ${actionBtn}
    </div>`;
}

// Renders a card with a "Find Mentees" button when the mentor has fewer than 3 active mentees.
function renderAddMenteeCard() {
  return `
    <div class="mentee-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
      <i class="fa fa-user-plus fa-2x" style="color:#0ea5e9;margin-bottom:1rem;"></i>
      <h3>Add New Mentee</h3>
      <p>Invite someone new to learn under your guidance</p>
      <button class="btn btn-primary full-width" onclick="openMenteeFinder()">Find Mentees</button>
    </div>`;
}

//Renders a disabled card saying the mentee limit (3) has been reached.
function renderMenteeLimitReachedCard() {
  return `
    <div class="mentee-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;opacity:0.6;">
      <i class="fa fa-user-lock fa-2x" style="color:#9ca3af;margin-bottom:1rem;"></i>
      <h3>Mentee Limit Reached</h3>
      <p>You already have 3 active mentees</p>
      <button class="btn full-width" disabled>Limit Reached</button>
    </div>`;
}

// Renders a card prompting the user to submit a request to find a mentor.
function renderAddMentorCard() {
  return `
    <div class="mentee-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
      <i class="fa fa-user-plus fa-2x" style="color:#0ea5e9;margin-bottom:1rem;"></i>
      <h3>Find New Mentor</h3>
      <p>Look for a mentor who aligns with your learning goals</p>
      <button class="btn btn-primary full-width" onclick="openMentorFinder()">Submit Request</button>
    </div>`;
}

// Renders a disabled card if the mentee already has 3 mentors.
function renderMentorLimitReachedCard() {
  return `
    <div class="mentee-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;opacity:0.6;">
      <i class="fa fa-user-lock fa-2x" style="color:#9ca3af;margin-bottom:1rem;"></i>
      <h3>Mentor Limit Reached</h3>
      <p>You already have 3 active mentors</p>
      <button class="btn full-width" disabled>Limit Reached</button>
    </div>`;
}

function openMenteeFinder() {
  window.location.href = "discover.html#mentees";
}

function openMentorFinder() {
  document.getElementById('mentorApplicationModal')?.classList.remove('hidden');
}

// Loads and renders: Active & pending mentees (for mentors/ mentees)

async function loadMentorAndMenteeViews() {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  const { data: mentorships } = await supabase
    .from('mentorships')
    .select(`mentee_id, status, compatibility_score, mentee:profiles!mentorships_mentee_id_fkey (id, name, designation, skills, learning_goals)`)
    .eq('mentor_id', user.id);

  const activeMentees = mentorships?.filter(m => m.status === 'active').slice(0, 3) || [];
  const pendingMentees = mentorships?.filter(m => m.status === 'pending')?.sort((a, b) => b.compatibility_score - a.compatibility_score) || [];

  document.querySelector('.scroll-container.active').innerHTML =
    activeMentees.map(m => renderCard(m.mentee, null, false)).join('') +
    (activeMentees.length < 3 ? renderAddMenteeCard() : renderMenteeLimitReachedCard());

  document.querySelector('.scroll-container.pending').innerHTML =
    pendingMentees.map(m => renderCard(m.mentee, m.compatibility_score, true)).join('');

  const { data: menteeMentorships } = await supabase
    .from('mentorships')
    .select(`mentor_id, status, compatibility_score, mentor:profiles!mentorships_mentor_id_fkey (id, name, designation, skills, learning_style)`)
    .eq('mentee_id', user.id);

  const myMentors = menteeMentorships?.filter(m => m.status === 'active').slice(0, 3) || [];
  const myPending = menteeMentorships?.filter(m => m.status === 'pending') || [];

  document.querySelector('.scroll-container.mentee-active').innerHTML =
    myMentors.map(m => renderCard(m.mentor, null, false)).join('') +
    (myMentors.length < 3 ? renderAddMentorCard() : renderMentorLimitReachedCard());

  document.querySelector('.scroll-container.mentee-pending').innerHTML =
    myPending.map(m => renderCard(m.mentor, m.compatibility_score, true)).join('');
}

function computeCompatibility(app, mentor) {
  const overlap = (a, b) => a.filter(x => b.includes(x));
  const s = overlap(app.skills, mentor.skills).length;
  const l = overlap(app.learning_style, mentor.learning_style).length;
  const c = overlap(app.comm_mode, mentor.comm_mode).length;
  return Math.min(100, (s + l + c) * 20);
}

// Shows a mentor application along with 1–3 compatible mentors with buttons to request or cancel mentorship.
function renderRecommendation(app, matches) {
  return `
    <div class="mentee-card" style="margin-bottom:2rem;padding:1rem;border:1px solid #ddd;border-radius:8px;">
      <h3>Application: ${app.learning_outcome}</h3>
      <p><strong>Skills:</strong> ${app.skills.map(s => `<span class="badge">${s}</span>`).join(' ')}</p>
      <p><strong>Learning Style:</strong> ${app.learning_style.map(s => `<span class="badge">${s}</span>`).join(' ')}</p>
      <p><strong>Comm Mode:</strong> ${app.comm_mode.map(s => `<span class="badge">${s}</span>`).join(' ')}</p>
      <hr/>
      ${matches.map(mentor => `
        <div style="margin:0.5rem 0;padding:0.5rem;border-bottom:1px dashed #ccc;">
          <strong>${mentor.name}</strong> - ${mentor.score}% Match<br>
          <small>${mentor.designation}</small><br>
          <span>Skills: ${mentor.skills.map(s => `<span class='badge'>${s}</span>`).join(' ')}</span><br>
          <button class="btn btn-primary small" onclick="requestMentorship('${app.id}', '${mentor.id}', this)">Request Mentorship</button>
          <button class="btn btn-danger small hidden" onclick="cancelMentorship('${mentor.id}', this)">Cancel Request</button>
        </div>`).join('')}
    </div>`;
}

// Loads all mentor_applications by the logged-in user, finds mentors who are accepting applications, scores compatibility, ranks them, and displays recommendations using renderRecommendation.

async function loadRecommendationsForApplication(app) {
  // Example: fetch mentors matching the skills, learning_style, comm_mode of the application
  // You may need to adjust the table/column names to fit your schema
  const { data: mentors, error } = await supabase
    .from('profiles')
    .select('*')
    .overlaps('skills', app.skills)
    .overlaps('learning_style', app.learning_style)
    .overlaps('comm_mode', app.comm_mode);

  const container = document.querySelector('.scroll-container.mentee-pending');
  container.innerHTML = '';

  if (error) {
    container.innerHTML = '<div class="error">Failed to load recommendations.</div>';
    return;
  }

  if (!mentors || mentors.length === 0) {
    container.innerHTML = '<div class="empty">No mentor recommendations found for this application.</div>';
    return;
  }

  mentors.forEach(mentor => {
    let score = mentor.score;
    if (typeof score !== 'number' && typeof computeCompatibility === 'function') {
      score = computeCompatibility(app, mentor);
    }

    const div = document.createElement('div');
    div.className = 'application-card';
    div.innerHTML = `
      <strong>Name:</strong>
      <h3 style="font-weight: 400; color: #0f172a; margin: 0;">${mentor.name}</h3>
      <strong>Description:</strong>
      <div><em>${mentor.description || ''}</em></div>
      <strong>Compatibility:</strong>
      <div class="compat-label">${score || 0}% Match</div>
      <strong>Skills:</strong>
      <div>${(mentor.skills || []).join(', ')}</div>
      <strong>Learning Styles:</strong>
      <div>${(mentor.learning_style || []).join(', ')}</div>
      <strong>Communication Modes:</strong>
      <div>${(mentor.comm_mode || []).join(', ')}</div>
      <button class="btn btn-primary">Request Mentorship</button>
    `;
    container.appendChild(div);
  });
}

async function requestMentorship(appId, mentorId, btn) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  btn.disabled = true;
  btn.textContent = 'Sending...';

  const { error } = await supabase.from('mentorships').insert({
    mentee_id: user.id,
    mentor_id: mentorId,
    status: 'pending',
    compatibility_score: 0
  });

  if (error) {
    alert("Failed to send request.");
    console.error(error);
    btn.disabled = false;
    btn.textContent = 'Request Mentorship';
  } else {
    btn.textContent = 'Request Sent ✅';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-success');
    const cancelBtn = btn.nextElementSibling;
    cancelBtn.classList.remove('hidden');
    reloadRecommendations();
  }
}

async function cancelMentorship(mentorId, btn) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  const confirmed = confirm('Are you sure you want to cancel this mentorship request?');
  if (!confirmed) return;

  const { error } = await supabase.from('mentorships')
    .delete()
    .eq('mentee_id', user.id)
    .eq('mentor_id', mentorId)
    .eq('status', 'pending');

  if (error) {
    alert("Failed to cancel request.");
    console.error(error);
  } else {
    alert("Request canceled.");
    reloadRecommendations();
  }
}

function highlightSelectedApplication(selectedDiv) {
  document.querySelectorAll('.scroll-container.mentee-applications .application-card')
    .forEach(card => card.classList.remove('selected'));
  selectedDiv.classList.add('selected');
}

// After applications.forEach in loadMenteeApplications
// On page load, show recommendations for the first application (optional)
if (applications.length > 0) {
  const firstCard = container.querySelector('.application-card');
  if (firstCard) {
    highlightSelectedApplication(firstCard);
    loadRecommendationsForApplication(applications[0]);
  }
}
