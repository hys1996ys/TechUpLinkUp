// mentorshipLogic.js

// Renders a mentor or mentee profile card
function renderCard(profile, score, isPending = false, mentorshipId = null, isMentor = false) {
  const avatar = isMentor ? '' : `<div class="avatar-circle-sm">${profile?.name?.charAt(0)?.toUpperCase() || 'U'}</div>`;
  const skills = (profile.skills || []).map(skill => `<span class="badge">${skill}</span>`).join('');
  const goals = (profile.learning_goals || profile.learning_style || []).map(g => `<span class="badge">${g}</span>`).join('');
  const matchBar = isPending && score !== null && score !== undefined
    ? `<div class="compat-label">${score}% Match</div><div class="compat-bar"><div class="compat-fill" style="width: ${score}%;"></div></div>`
    : '';
  // For mentor cards: Name (Job Title)
  const nameLine = isMentor
    ? `<h3>${profile.name}${profile.designation ? ` <span style="font-weight:400; color:#64748b;">(${profile.designation})</span>` : ''}</h3>`
    : `<h3>${profile.name}</h3>`;
  // For mentor cards: Description with title and spacing
  const description = isMentor && profile.description
    ? `<div style="height:0.5rem;"></div><strong>Description</strong><div style="margin-bottom:0.5rem;"><em>${profile.description}</em></div>`
    : '';
  const viewProfileBtn = isMentor
    ? `<button class="btn full-width" onclick="scrollToApplication('${profile.application_id || ''}')"><i class="fa fa-eye"></i> View Application</button>`
    : `<button class="btn full-width"><i class="fa fa-eye"></i> View Application</button>`;
  const actionBtn = isPending && mentorshipId
    ? `<button class="btn btn-success full-width" onclick="acceptMentee('${mentorshipId}', this)">Accept</button>
       <button class="btn btn-danger full-width" onclick="rejectMentee('${mentorshipId}', this)">Reject</button>`
    : viewProfileBtn;

  return `
    <div class="mentee-card">
      ${avatar}
      ${nameLine}
      ${description}
      ${!isMentor ? `<p>${profile.designation || ''}</p>` : ''}
      ${matchBar}
      <strong>Learning Goals</strong>
      <div class="badge-group">${goals}</div>
      <div style="height:0.5rem;"></div>
      <strong>Skills</strong>
      <div class="badge-group">${skills}</div>
      ${actionBtn}
    </div>`;
}

// Add/limit cards for mentors/mentees
function renderAddMenteeCard() {
  return `
    <div class="mentee-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
      <i class="fa fa-user-plus fa-2x" style="color:#0ea5e9;margin-bottom:1rem;"></i>
      <h3>Add New Mentee</h3>
      <p>Invite someone new to learn under your guidance</p>
      <button class="btn btn-primary full-width" onclick="openMenteeFinder()">Find Mentees</button>
    </div>`;
}
function renderMenteeLimitReachedCard() {
  return `
    <div class="mentee-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;opacity:0.6;">
      <i class="fa fa-user-lock fa-2x" style="color:#9ca3af;margin-bottom:1rem;"></i>
      <h3>Mentee Limit Reached</h3>
      <p>You already have 3 active mentees</p>
      <button class="btn full-width" disabled>Limit Reached</button>
    </div>`;
}
function renderAddMentorCard() {
  return `
    <div class="mentee-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
      <i class="fa fa-user-plus fa-2x" style="color:#0ea5e9;margin-bottom:1rem;"></i>
      <h3>Find New Mentor</h3>
      <p>Look for a mentor who aligns with your learning goals</p>
      <button class="btn btn-primary full-width" onclick="openMentorFinder()">Submit Request</button>
    </div>`;
}
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

  // Mentor's mentees
  const { data: mentorships } = await supabase
    .from('mentorships')
    .select(`id, mentee_id, status, compatibility_score, mentee:profiles!mentorships_mentee_id_fkey (id, name, designation, skills, learning_goals)`)
    .eq('mentor_id', user.id);

  const activeMentees = mentorships?.filter(m => m.status === 'active').slice(0, 3) || [];
  const pendingMentees = mentorships?.filter(m => m.status === 'pending')?.sort((a, b) => b.compatibility_score - a.compatibility_score) || [];

  document.querySelector('.scroll-container.active').innerHTML =
    activeMentees.map(m => renderCard(m.mentee, null, false)).join('') +
    (activeMentees.length < 3 ? renderAddMenteeCard() : renderMenteeLimitReachedCard());

  document.querySelector('.scroll-container.pending').innerHTML =
    pendingMentees.map(m => renderCard(m.mentee, m.compatibility_score, true, m.id)).join('');

  // Mentee's mentors
  const { data: menteeMentorships } = await supabase
    .from('mentorships')
    .select(`id, mentor_id, application_id, status, compatibility_score, mentor:profiles!mentorships_mentor_id_fkey (id, name, designation, skills, learning_style, description)`)
    .eq('mentee_id', user.id);

  const myMentors = menteeMentorships?.filter(m => m.status === 'active').slice(0, 3) || [];
  const myPending = menteeMentorships?.filter(m => m.status === 'pending') || [];

  document.querySelector('.scroll-container.mentee-active').innerHTML =
    myMentors.map(m => renderCard({ ...m.mentor, application_id: m.application_id }, null, false, null, true)).join('') +
    (myMentors.length < 3 ? renderAddMentorCard() : renderMentorLimitReachedCard());

  document.querySelector('.scroll-container.mentee-pending').innerHTML =
    myPending.map(m => renderCard(m.mentor, m.compatibility_score, true, m.id, true)).join('');

    

  }

// Accept/reject mentee requests (mentor side)
async function acceptMentee(mentorshipId, btn) {
  btn.disabled = true;
  const { error } = await supabase
    .from('mentorships')
    .update({ status: 'active' })
    .eq('id', mentorshipId);

  if (error) {
    alert("Failed to accept mentee.");
    btn.disabled = false;
  } else {
    btn.textContent = 'Accepted';
    btn.classList.remove('btn-success');
    btn.classList.add('btn-secondary');
    loadMentorAndMenteeViews();
  }
}
async function rejectMentee(mentorshipId, btn) {
  btn.disabled = true;
  const { error } = await supabase
    .from('mentorships')
    .update({ status: 'rejected' })
    .eq('id', mentorshipId);

  if (error) {
    alert("Failed to reject mentee.");
    btn.disabled = false;
  } else {
    btn.textContent = 'Rejected';
    btn.classList.remove('btn-danger');
    btn.classList.add('btn-secondary');
    loadMentorAndMenteeViews();
  }
}

// Mentor recommendations for a mentee application (separate section)
async function loadRecommendationsForApplication(app) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  // Fetch mentors matching the application
  const { data: mentors, error } = await supabase
    .from('profiles')
    .select('*')
    .overlaps('skills', app.skills)
    .overlaps('learning_style', app.learning_style)
    .overlaps('comm_mode', app.comm_mode);

  // Fetch existing mentorships for this mentee
  const { data: myMentorships } = await supabase
    .from('mentorships')
    .select('mentor_id, application_id, status')
    .eq('mentee_id', user.id);

  const container = document.querySelector('.scroll-container.mentor-recommendations');
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
    let score = typeof mentor.score === 'number'
      ? mentor.score
      : (typeof computeCompatibility === 'function' ? computeCompatibility(app, mentor) : 0);

    // Check if a mentorship already exists with this mentor
    const existing = myMentorships?.find(
      m => m.mentor_id === mentor.id && m.application_id === app.id
    );

    let btnHtml = '';
 if (existing && existing.status === 'pending') {
  btnHtml = `<button class="btn btn-success" disabled>Request Sent</button>`;
} else if (existing && existing.status === 'active') {
  btnHtml = `<button class="btn btn-secondary" disabled>Mentorship Active</button>`;
} else {
  btnHtml = `<button class="btn btn-primary" onclick="requestMentorship('${app.id}', '${mentor.id}', this)">Request Mentorship</button>`;
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
      ${btnHtml}
    `;
    container.appendChild(div);
  });

  // Scroll to mentor recommendations section after rendering
  container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Request/cancel mentorship (mentee side)
async function requestMentorship(appId, mentorId, btn) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  btn.disabled = true;
  btn.textContent = 'Sending...';

  const { data, error } = await supabase.from('mentor_applications').insert({
    mentee_id: user.id,
    mentor_id: mentorId,
    application_id: appId, // <-- add this
    status: 'pending',
    compatibility_score: 0
  }).select().single();

  if (error) {
    alert("Failed to send request.");
    console.error(error);
    btn.disabled = false;
    btn.textContent = 'Request Mentorship';
  } else {
    loadMentorAndMenteeViews();
    // Optionally reload recommendations if you want to update that section too
    // loadRecommendationsForApplication(...);
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
    loadMentorAndMenteeViews();
    // Optionally reload recommendations if you want to update that section too
    // loadRecommendationsForApplication(...);
  }
}

// Utility: Compute compatibility score
function computeCompatibility(app, mentor) {
  const overlap = (a, b) => a.filter(x => b.includes(x));
  const s = overlap(app.skills, mentor.skills).length;
  const l = overlap(app.learning_style, mentor.learning_style).length;
  const c = overlap(app.comm_mode, mentor.comm_mode).length;
  return Math.min(100, (s + l + c) * 20);
}

function highlightSelectedApplication(selectedDiv) {
  document.querySelectorAll('.scroll-container.mentee-applications .application-card')
    .forEach(card => card.classList.remove('selected'));
  selectedDiv.classList.add('selected');
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  loadMenteeApplications();
});

// After fetching applications and mentorships:
async function loadMenteeApplications() {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  // Fetch applications
  const { data: applications, error: appError } = await supabase
    .from('mentor_applications')
    .select('*')
    .eq('user_id', user.id);

  // Fetch mentorships
  const { data: myMentorships, error: mentorError } = await supabase
    .from('mentorships')
    .select('mentor_id, application_id, status')
    .eq('mentee_id', user.id);

  if (appError || mentorError) return;

  const pending = [];
  const inactive = [];

  applications.forEach(app => {
    // Find if this application has an active mentorship
    const activeMentorship = myMentorships?.find(
      m => m.application_id === app.id && m.status === 'active'
    );

    const div = document.createElement('div');
    div.className = 'application-card';
    if (activeMentorship) {
      div.classList.add('inactive');
    }
    div.setAttribute('data-app-id', app.id);
    div.innerHTML = `
      <strong>Learning Outcome:</strong> ${app.learning_outcome}<br>
      <strong>Skills:</strong> ${app.skills?.join(', ')}<br>
      <strong>Learning Styles:</strong> ${app.learning_style?.join(', ')}<br>
      <strong>Communication Modes:</strong> ${app.comm_mode?.join(', ')}<br>
      <small>Submitted: ${new Date(app.created_at).toLocaleString()}</small>
    `;
    if (activeMentorship) {
      inactive.push(div);
    } else {
      div.addEventListener('click', () => {
        highlightSelectedApplication(div);
        loadRecommendationsForApplication(app);
      });
      pending.push(div);
    }
  });

  // Render pending first, then inactive (greyed out) at the back
  const container = document.querySelector('.scroll-container.mentee-applications');
  container.innerHTML = '';
  pending.forEach(div => container.appendChild(div));
  inactive.forEach(div => container.appendChild(div));
}

function scrollToApplication(appId) {
  const appCard = document.querySelector(`.scroll-container.mentee-applications .application-card[data-app-id="${appId}"]`);
  if (appCard) {
    appCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    appCard.classList.add('selected');
    setTimeout(() => appCard.classList.remove('selected'), 2000); // Optional: highlight briefly
  }
}
