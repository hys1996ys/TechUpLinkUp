// mentorshipLogic.js

let applicationFilter = 'all'; // global filter state

// Renders a mentor or mentee profile card
function renderCard(profile, score = null, isPending = false, mentorshipId = null, isMentor = false, applicationId = null) {
  // Only show avatar for mentee cards
  const avatar = isMentor ? '' : `<div class="avatar-circle-sm">${profile?.name?.charAt(0)?.toUpperCase() || 'U'}</div>`;
  const matchBar = isPending && score !== null && score !== undefined
    ? `<div class="compat-label">${score}% Match</div><div class="compat-bar"><div class="compat-fill" style="width: ${score}%;"></div></div>`
    : '';
  const description = isMentor && profile.description
    ? `<strong style="display:block;margin-bottom:0.25rem;font-family:inherit;font-size:1rem;color:#007bff;">Description:</strong>
       <div style="margin-bottom:0.75rem;font-family:inherit;font-size:1rem;"><em>${profile.description}</em></div>`
    : '';

    const learningOutcome = isMentor && profile.learning_outcome
  ? `<strong style="display:block;margin-bottom:0.25rem;font-family:inherit;font-size:1rem;color:#007bff;">Learning Outcome:</strong>
     <div style="margin-bottom:0.75rem;font-family:inherit;font-size:1rem;">${profile.learning_outcome}</div>`
  : '';

  // Mentor card: plain text, not badges, with spacing and font
  const skills = isMentor
    ? `<strong style="display:block;margin-bottom:0.25rem;font-family:inherit;font-size:1rem;color:#007bff;">Skills:</strong>
       <div style="margin-bottom:0.75rem;font-family:inherit;font-size:1rem;">${(profile.skills || []).join(', ')}</div>`
    : (profile.skills || []).map(skill => `<span class="badge">${skill}</span>`).join('');
  const learningStyles = isMentor && profile.learning_style
    ? `<strong style="display:block;margin-bottom:0.25rem;font-family:inherit;font-size:1rem;color:#007bff;">Learning Styles:</strong>
       <div style="margin-bottom:0.75rem;font-family:inherit;font-size:1rem;">${(Array.isArray(profile.learning_style) ? profile.learning_style.join(', ') : profile.learning_style)}</div>`
    : '';
  const commModes = isMentor && profile.comm_mode
    ? `<strong style="display:block;margin-bottom:0.25rem;font-family:inherit;font-size:1rem;color:#007bff;">Communication Modes:</strong>
       <div style="margin-bottom:0.75rem;font-family:inherit;font-size:1rem;">${(Array.isArray(profile.comm_mode) ? profile.comm_mode.join(', ') : profile.comm_mode)}</div>`
    : '';
  const actionBtn = isPending && mentorshipId
    ? `<button class="btn btn-success full-width" onclick="acceptMentee('${mentorshipId}', this)">Accept</button>
       <button class="btn btn-danger full-width" onclick="rejectMentee('${mentorshipId}', this)">Reject</button>`
   : `<button class="btn btn-success full-width" onclick="scrollToApplication('${applicationId || profile.application_id || ''}')"><i class="fa fa-eye"></i> View Application</button>`;
  
// --- Add Google Meet icon/button for mentor cards in mentee view ---
  const googleMeetBtn = isMentor
    ? `<div style="position:absolute;top:0.5rem;right:0.5rem;">
        <button class="google-meet-btn" title="Set up Google Meet" onclick="setupGoogleMeet('${profile.id}', event)">
          <i class="fa-solid fa-video"></i>
        </button>
      </div>`
    : '';

return `
  <div class="mentee-card" style="font-family:inherit;font-size:1rem;">
  ${googleMeetBtn}  
  ${avatar}
    <h3 style="font-weight: bold; color: #007bff; margin: 0 0 0.5rem 0; font-family:inherit; font-size:1.1rem;">
      ${profile.name}
      ${profile.designation ? `<span style="font-weight:bold;color:#007bff;font-size:1rem; margin-left:0.5rem;">(${profile.designation})</span>` : ''}
    </h3>
  
      ${learningOutcome}
    ${matchBar}
    ${skills}
    ${learningStyles}
    ${commModes}
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
      <button class="btn btn-primary full-width findMenteesBtn" type="button">Find Mentees</button>
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
  const { data: mentorships, error } = await supabase
  .from('mentorships')
  .select(`
    id,
    mentee_id,
    status,
    compatibility_score,
    application_id,
    mentee:profiles!mentee_id (
      id, name, designation, skills, learning_goals, learning_style, comm_mode, description
    )
  `)
  .eq('mentor_id', user.id);

if (error) {
  console.error('Supabase error:', error);
  return;
}

// 2. Collect all application_ids
const appIds = mentorships.map(m => m.application_id).filter(Boolean);

// 3. Fetch mentor_applications for those ids
const { data: applications, error: appError } = await supabase
  .from('mentor_applications')
  .select('id, learning_outcome, skills, learning_style, comm_mode')
  .in('id', appIds);

if (appError) {
  console.error('Supabase error:', appError);
}

// 4. Map application_id to learning_outcome
const appMap = {};
(applications || []).forEach(app => {
  appMap[app.id] = {
    learning_outcome: app.learning_outcome,
    skills: app.skills,
    learning_style: app.learning_style,
    comm_mode: app.comm_mode
  };
});

// 5. When rendering:
const activeMentees = mentorships
  ?.filter(m => m.status === 'active' && m.mentee)
  .slice(0, 3) || [];
const mentorActiveContainer = document.querySelector('.scroll-container.active');
if (mentorActiveContainer) {
  let html = activeMentees.map(m => {
    const appFields = appMap[m.application_id] || {};
    return renderCard(
      { ...m.mentee, ...appFields },
      null,
      false,
      null,
      true,
      m.application_id
    );
  }).join('');
  if (activeMentees.length < 3) {
    for (let i = 0; i < 3 - activeMentees.length; i++) {
      html += renderAddMenteeCard();
    }
  } else {
    html += renderMenteeLimitReachedCard();
  }
  mentorActiveContainer.innerHTML = html;
}
  const pendingContainer = document.querySelector('.scroll-container.pending');
if (pendingContainer && typeof pendingMentees !== 'undefined') {
  pendingContainer.innerHTML =
    pendingMentees.map(m => renderCard(m.mentee, m.compatibility_score, true, m.id)).join('');
}

  // Mentee's mentors
  const { data: menteeMentorships } = await supabase
  .from('mentorships')
  .select(`id, mentor_id, application_id, status, compatibility_score, mentor:profiles!mentorships_mentor_id_fkey (id, name, designation, skills, learning_style, comm_mode, description)`)
  .eq('mentee_id', user.id);

  const myPending = menteeMentorships?.filter(m => m.status === 'pending') || [];

 const myMentors = menteeMentorships?.filter(m => m.status === 'active').slice(0, 3) || [];
 console.log('Mentee mentorships:', menteeMentorships);
console.log('My mentors:', myMentors);

// --- Insert here ---
const mentorAppIds = myMentors.map(m => m.application_id).filter(Boolean);

let mentorApplications = [];
let mentorAppMap = {};
if (mentorAppIds.length > 0) {
  const { data: mentorApps, error: mentorAppError } = await supabase
    .from('mentor_applications')
    .select('id, skills, learning_style, comm_mode')
    .in('id', mentorAppIds);

  if (mentorAppError) {
    console.error('Supabase error:', mentorAppError);
  }
  mentorApplications = mentorApps || [];
  mentorApplications.forEach(app => {
    mentorAppMap[app.id] = app;
  });
}
// --- End insert ---

 const menteeActiveContainer = document.querySelector('.scroll-container.mentee-active');
if (menteeActiveContainer) {
  let html = myMentors.map(m => {
    // Use only mentor profile fields for display
    return renderCard(
      { ...m.mentor, application_id: m.application_id },
      null,
      false,
      m.id,
      true,
      m.application_id 
    );
  }).join('');
  if (myMentors.length < 3) {
    for (let i = 0; i < 3 - myMentors.length; i++) {
      html += renderAddMentorCard();
    }
  } else {
    html += renderMentorLimitReachedCard();
  }
  menteeActiveContainer.innerHTML = html;
}

  const menteePendingContainer = document.querySelector('.scroll-container.mentee-pending');
if (menteePendingContainer) {
  menteePendingContainer.innerHTML =
    myPending.map(m => renderCard(m.mentor, m.compatibility_score, true, m.id, true)).join('');
}
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
     loadMenteeApplications() && loadMentorApplications();
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
async function loadRecommendationsForApplication(app, mentorIds = null) {
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
    .select('id,mentor_id, application_id, status')
    .eq('mentee_id', user.id);

  const container = document.querySelector('.scroll-container.mentor-recommendations');
  container.innerHTML = '';

  if (error) {
    container.innerHTML = '<div class="error">Failed to load recommendations.</div>';
    return;
  }

let filteredMentors = Array.isArray(mentors) ? mentors.filter(m => m.id !== user.id) : [];

if (mentorIds && Array.isArray(mentorIds)) {
  filteredMentors = filteredMentors.filter(m => mentorIds.includes(m.id));
}

if (mentorIds && Array.isArray(mentorIds) && filteredMentors.length === 0) {
  const { data: extraMentors } = await supabase
    .from('profiles')
    .select('*')
    .in('id', mentorIds);

  console.log('mentorIds:', mentorIds);
  console.log('filteredMentors before extraMentors:', filteredMentors);
  console.log('extraMentors:', extraMentors);

  if (extraMentors && extraMentors.length > 0) {
    const existingIds = new Set(filteredMentors.map(m => m.id));
    extraMentors.forEach(m => {
      if (!existingIds.has(m.id) && m.id !== user.id) filteredMentors.push(m);
    });
  }
  console.log('filteredMentors after extraMentors:', filteredMentors);
}

// --- Now check if there are any mentors to show ---
if (!filteredMentors.length) {
  container.innerHTML = '<div class="empty">No mentor recommendations found for this application.</div>';
  return;
}

  // Use filteredMentors instead of mentors in your rendering loop

  filteredMentors.forEach(mentor => {
    let score = typeof mentor.score === 'number'
      ? mentor.score
      : (typeof computeCompatibility === 'function' ? computeCompatibility(app, mentor) : 0);

    // Check if a mentorship already exists with this mentor
    const existing = myMentorships?.find(
      m => m.mentor_id === mentor.id && m.application_id === app.id
    );

    let btnHtml = '';
if (existing && existing.status === 'pending') {
  btnHtml = `
    <button class="btn btn-success" disabled>Request Sent</button>
    <button class="btn"
      data-mentorship-id="${existing.id}"
      data-app-id="${app.id}"
      onclick="handleWithdrawClick(this)">Withdraw</button>
  `;
} else if (existing && existing.status === 'active') {
  btnHtml = `<button class="btn btn-secondary" disabled>Mentorship Active</button>`;
} else if (existing && existing.status === 'completed') {
  btnHtml = `<button class="btn btn-secondary" disabled>Completed</button>`;
} else if (existing && existing.status === 'rejected') {
  btnHtml = `<button class="btn btn-danger" disabled>Rejected</button>`;
} else {
  // No mentorship or not rejected for this mentor+app, allow re-apply
  btnHtml = `<button class="btn btn-primary" onclick='requestMentorship("${app.id}", "${mentor.id}", this, ${JSON.stringify(app)})'>Request Mentorship</button>`;
}

    const div = document.createElement('div');
    div.className = 'application-card';
    div.style.position = 'relative';
    // Ensure consistent font family and size
    div.style.fontFamily = 'inherit';
    div.style.fontSize = '1rem';

    div.innerHTML = `
      <strong>Name:</strong>
      <h3 style="font-weight: 400; color: #0f172a; margin: 0; font-family:inherit; font-size:1.1rem;">
        ${mentor.name}
        <span style="font-weight:400; color:#64748b; font-size:1rem; margin-left:0.5rem; font-family:inherit;">
          (${score || 0}% Match)
        </span>
      </h3>
      <strong>Description:</strong>
      <div style="font-family:inherit; font-size:1rem;"><em>${mentor.description || ''}</em></div>
      <strong>Skills:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.skills || []).join(', ')}</div>
      <strong>Learning Styles:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.learning_style || []).join(', ')}</div>
      <strong>Communication Modes:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.comm_mode || []).join(', ')}</div>
      ${btnHtml}
    `;
    container.appendChild(div);
  });

  // Scroll to mentor recommendations section after rendering
  container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Request/cancel mentorship (mentee side)

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


// Request/cancel mentorship (mentee side)

async function requestMentorship(appId, mentorId, btn, app) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  btn.disabled = true;
  btn.textContent = 'Sending...';

  const { error } = await supabase.from('mentorships').insert({
    mentee_id: user.id,
    mentor_id: mentorId,
    application_id: appId,
    status: 'pending',
    compatibility_score: 0
  });

  if (error) {
    alert("Failed to send request.");
    console.error(error);
    btn.disabled = false;
    btn.textContent = 'Request Mentorship';
  } else {
    btn.textContent = 'Request Sent';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-success');
    setTimeout(() => {
      loadRecommendationsForApplication(app);
      loadMentorAndMenteeViews();
      loadMenteeApplications();
      loadMentorApplications(); // <-- This is important!
    }, 800);
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

// Mentor recommendations for a mentee application (separate section)

// Request/cancel mentorship (mentee side)

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


// Request/cancel mentorship (mentee side)
async function requestMentorship(appId, mentorId, btn, app) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  btn.disabled = true;
  btn.textContent = 'Sending...';

  const { error } = await supabase.from('mentorships').insert({
    mentee_id: user.id,
    mentor_id: mentorId,
    application_id: appId,
    status: 'pending',
    compatibility_score: 0
  });

  if (error) {
    alert("Failed to send request.");
    console.error(error);
    btn.disabled = false;
    btn.textContent = 'Request Mentorship';
  } else {
    btn.textContent = 'Request Sent';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-success');
    setTimeout(() => {
      loadRecommendationsForApplication(app);
      loadMentorAndMenteeViews();
      loadMenteeApplications();
      loadMentorApplications(); // <-- This is important!
    }, 800);
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
// Initial load
document.addEventListener('DOMContentLoaded', async () => {
  // Fetch user session
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;

  // Redirect to home if not logged in
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  
  let userName = 'User';

  const logoutBtn = document.getElementById('logoutBtn');
  if (user) {
    // Fetch profile from Supabase
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();
    if (profile && profile.name) {
      userName = profile.name;
    }
    document.getElementById('userGreeting').classList.remove('hidden');
    logoutBtn?.classList.remove('hidden');
  } else {
    document.getElementById('userGreeting').classList.add('hidden');
    logoutBtn?.classList.add('hidden');
  }

  document.getElementById('userName').textContent = userName;
document.getElementById('userGreeting').classList.remove('hidden');

  document.addEventListener('click', async function(e) {
  if (e.target.classList.contains('findMenteesBtn')) {
    e.preventDefault();
    const recSection = document.querySelector('.scroll-container.mentee-recommendations');
    const section = recSection.closest('section') || recSection;
    recSection.classList.remove('hidden');
    recSection.style.display = '';
    await loadMenteeRecommendations();
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

  document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.addEventListener('click', function() {
      applicationFilter = this.getAttribute('data-filter');
      document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      // Clear mentor recommendations when filter changes
      const recSection = document.querySelector('.scroll-container.mentor-recommendations');
      if (recSection) {
        recSection.classList.add('hidden');
        recSection.style.display = 'none';
        recSection.innerHTML = '';
      }

      

      loadMenteeApplications();

      // Show mentor recommendations for first active card if filter is active
      if (applicationFilter === 'active') {
        // Wait for DOM update
        setTimeout(() => {
          const firstActive = document.querySelector('.scroll-container.mentee-applications .application-card.active-mentor');
          if (firstActive) {
            firstActive.classList.add('selected');
            const appId = firstActive.getAttribute('data-app-id');
            const app = window._menteeApplications?.find(a => a.id == appId);
            const mentorship = window._myMentorships?.find(m => m.application_id == appId && m.status === 'active');

            if (app && mentorship) {
              loadRecommendationsForApplication(app, [mentorship.mentor_id]);
              const recSection = document.querySelector('.scroll-container.mentor-recommendations');
              recSection.classList.remove('hidden');
              recSection.style.display = '';
            }
          }
        }, 100);
      }
    });
  });

  document.querySelector('.btn-filter[data-filter="all"]')?.classList.add('active');
  loadMenteeApplications();
  await loadMentorAndMenteeViews();
  await loadMentorApplications();
});

// After fetching applications and mentorships:
async function loadMenteeApplications() {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) {console.log("User not logged in"); return;}  

  const { data: applications, error } = await supabase
    .from('mentor_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });


  const container = document.querySelector('.scroll-container.mentee-applications');
  container.innerHTML = '';

  if (error) {
    container.innerHTML = '<div class="error">Failed to load applications.</div>';
    return;
  }

  if (!applications || applications.length === 0) {
    container.innerHTML = '<div class="empty">No pending applications.</div>';
    return;
  }

  // Fetch mentorships for status checks
  const { data: myMentorships } = await supabase
    .from('mentorships')
    .select('id, mentor_id, application_id, status')
    .eq('mentee_id', user.id);

      window._menteeApplications = applications;
  window._myMentorships = myMentorships;

  // Prepare arrays for each status
  const pending = [];
  const active = [];
  const completed = [];


  applications.forEach(app => {

    // Find mentorship for this application
  const mentorship = myMentorships?.find(
    m => m.application_id === app.id
  );

  // Determine decision
  // Determine decision

    // Find mentorships for this application
const activeMentorship = myMentorships?.find(
  m => m.application_id === app.id && m.status === 'active'
);
const pendingMentorship = myMentorships?.find(
  m => m.application_id === app.id && m.status === 'pending'
);
const rejectedMentorship = myMentorships?.find(
  m => m.application_id === app.id && m.status === 'rejected'
);
const completedMentorship = myMentorships?.find(
  m => m.application_id === app.id && (m.status === 'completed' || m.status === 'dissolved')
);

// Add this:
let decision = '';
let statusText = 'Pending';

if (completedMentorship) {
  decision = 'accepted'; // or 'completed'
  statusText = 'Completed';
} else if (activeMentorship) {
  decision = 'accepted';
  statusText = 'Active';
} else if (pendingMentorship) {
  decision = 'pending';
  statusText = 'Pending';
} else if (rejectedMentorship) {
  decision = 'rejected';
  statusText = 'Rejected';
}

    const hasMentorRequest = myMentorships?.some(
  m => m.application_id === app.id
);



    // Discard button: always disabled for active/completed
    const hasActiveOrCompletedMentorship = myMentorships?.some(
  m => m.application_id === app.id && (m.status === 'active' || m.status === 'completed')
);

const actionBtns = (app.status === 'completed' || hasMentorRequest) ? `
  <div style="position:absolute;top:0.5rem;right:0.5rem;z-index:2;">
    <button class="btn btn-sm btn-danger"
      style="padding:0.2rem 0.6rem;font-size:1.2rem;line-height:1;"
      title="You cannot discard this application"
      disabled
    >&times;</button>
  </div>
` : `
  <div style="position:absolute;top:0.5rem;right:0.5rem;z-index:2;">
    <button class="btn btn-sm btn-danger"
      style="padding:0.2rem 0.6rem;font-size:1.2rem;line-height:1;"
      title="Discard"
      onclick="discardApplication('${app.id}', this)"
    >&times;</button>
  </div>
`;
    const div = document.createElement('div');
    div.className = 'application-card';
    div.setAttribute('data-app-id', app.id);

    // Completed
    if (app.status === 'completed' || completedMentorship?.status === 'completed') {

  div.classList.add('inactive');
  div.style.background = '#f3f4f6';
  div.style.border = '2px solid #d1d5db';
  div.style.opacity = '1';
  div.innerHTML = `

  ${actionBtns}
  <strong>Learning Outcome:</strong> ${app.learning_outcome}<br>
  <strong>Skills:</strong> ${app.skills?.join(', ')}<br>
  <strong>Learning Styles:</strong> ${app.learning_style?.join(', ')}<br>
  <strong>Communication Modes:</strong> ${app.comm_mode?.join(', ')}<br><br>
  <small>Created: ${new Date(app.created_at).toLocaleString()}</small>
  <small>Status: ${statusText}</small>
  <button class="btn btn-primary full-width" onclick="scrollToApplication('${app.id}')">
    <i class="fa fa-user"></i> View Mentor
  </button>
  
`;
  // Allow click to view mentor recommendations for the matched mentor only
  div.addEventListener('click', () => {
    highlightSelectedApplication(div);
    const recSection = document.querySelector('.scroll-container.mentor-recommendations');
    recSection.classList.remove('hidden');
    recSection.style.display = '';
    if (completedMentorship) {
      loadRecommendationsForApplication(app, [completedMentorship.mentor_id]);
    }
  });
  completed.push({ div, created_at: app.created_at });
  return;
}

    // Active
    // ...existing code...

// Active
if (activeMentorship) {
  div.classList.add('active-mentor');
  div.style.background = '#d1fae5';
  div.style.border = '2px solid #10b981';
  div.style.opacity = '1';
  div.innerHTML = `
    <div style="position:absolute;top:0.5rem;left:0.5rem;">
      <i class="fa fa-lock" title="This application is locked because you have an active mentor." style="color:#059669;font-size:1.3rem;"></i>
    </div>
    ${actionBtns}
    <strong>Learning Outcome:</strong> ${app.learning_outcome}<br>
    <strong>Skills:</strong> ${app.skills?.join(', ')}<br>
    <strong>Learning Styles:</strong> ${app.learning_style?.join(', ')}<br>
    <strong>Communication Modes:</strong> ${app.comm_mode?.join(', ')}<br><br>
    <small>Created: ${new Date(app.created_at).toLocaleString()}</small>
    <small>Status: ${statusText}</small>
    <button class="btn btn-danger full-width" style="margin-top:0.5rem;" onclick="dissolveMentor('${activeMentorship.id}', this)">
      <i class="fa fa-unlink"></i> Dissolve Mentorship
    </button>
  `;
  div.addEventListener('click', () => {
    highlightSelectedApplication(div);
    const recSection = document.querySelector('.scroll-container.mentor-recommendations');
    if (recSection) {
      recSection.classList.remove('hidden');
      recSection.style.display = '';
    recSection.innerHTML = `
  <div class="empty" style="background:#f8fafc; color:#111827; border-left:4px solid #e5e7eb; padding:1.2rem 2rem; border-radius:0.5rem; margin:1.5rem 0; width:100%; max-width:100%; box-sizing:border-box; text-align:left;">
    <i class="fa fa-info-circle" style="margin-right:0.5rem; color:#94a3b8;"></i>
    No mentee applications found that match your profile.
  </div>
`;
    }
  });
  active.push({ div, created_at: app.created_at });
  return;
}
  // Rejected
// Pending (should take priority over rejected)
if (pendingMentorship) {
  // ... render pending card ...
  div.className = 'application-card';
  div.style.background = '#fff';
  div.style.border = '2px solid #e5e7eb';
  div.style.opacity = '1';
  div.innerHTML = `
  ${actionBtns}
  <strong>Learning Outcome:</strong> ${app.learning_outcome}<br>
  <strong>Skills:</strong> ${app.skills?.join(', ')}<br>
  <strong>Learning Styles:</strong> ${app.learning_style?.join(', ')}<br>
  <strong>Communication Modes:</strong> ${app.comm_mode?.join(', ')}<br><br>
  <small>Created: ${new Date(app.created_at).toLocaleString()}</small>
  <small>Status: Pending</small>
  <button class="btn btn-primary full-width" onclick="scrollToApplication('${app.id}')">
    <i class="fa fa-eye"></i> View Recommendations
  </button>
`;
  div.addEventListener('click', () => {
    highlightSelectedApplication(div);
    const recSection = document.querySelector('.scroll-container.mentor-recommendations');
    recSection.classList.remove('hidden');
    recSection.style.display = '';
    loadRecommendationsForApplication(app);
  });
  pending.push({ div, created_at: app.created_at });
  return;
}

// Rejected (only if no pending mentorship)
if (rejectedMentorship) {
  div.classList.add('inactive');
  div.style.background = '#fef3c7'; // light orange background
  div.style.border = '2px solid #f59e42'; // orange border
  div.style.opacity = '1';
  div.style.filter = ''; // remove grayscale
  div.innerHTML = `
    <div style="position:absolute;top:0.5rem;left:0.5rem;">
      <i class="fa fa-ban" title="This application is rejected." style="color:#9ca3af;font-size:1.3rem;"></i>
    </div>
    ${actionBtns}
    <strong>Learning Outcome:</strong> ${app.learning_outcome}<br>
    <strong>Skills:</strong> ${app.skills?.join(', ')}<br>
    <strong>Learning Styles:</strong> ${app.learning_style?.join(', ')}<br>
    <strong>Communication Modes:</strong> ${app.comm_mode?.join(', ')}<br><br>
    <small>Created: ${new Date(app.created_at).toLocaleString()}</small>
    <small>Status: Rejected</small>
    <button class="btn btn-primary full-width" style="margin-top:0.5rem;" onclick="showMentorRecommendations('${app.id}');event.stopPropagation();">
  <i class="fa fa-search"></i> Find New Mentor
</button> 
  `;
  div.addEventListener('click', () => {
    highlightSelectedApplication(div);
    showMentorRecommendations(app.id);
  });
  completed.push({ div, created_at: app.created_at });
  return;
}   // Pending/normal
  div.innerHTML = `
  ${actionBtns}
  <strong>Learning Outcome:</strong> ${app.learning_outcome}<br>
  <strong>Skills:</strong> ${app.skills?.join(', ')}<br>
  <strong>Learning Styles:</strong> ${app.learning_style?.join(', ')}<br>
  <strong>Communication Modes:</strong> ${app.comm_mode?.join(', ')}<br><br>
  <small>Created: ${new Date(app.created_at).toLocaleString()}</small>
  <small>Status: Pending</small>
  <button class="btn btn-primary full-width" onclick="showMentorRecommendations('${app.id}');event.stopPropagation();">
    <i class="fa fa-search"></i> Find Mentor
  </button>
`;
    div.addEventListener('click', () => {
      highlightSelectedApplication(div);
      const recSection = document.querySelector('.scroll-container.mentor-recommendations');
      recSection.classList.remove('hidden');
      recSection.style.display = '';
      loadRecommendationsForApplication(app);
    });
    pending.push({ div, created_at: app.created_at });
  });

  // Sort each group by most recent first
  const sortByDateDesc = (a, b) => new Date(b.created_at) - new Date(a.created_at);
  pending.sort(sortByDateDesc);
  active.sort(sortByDateDesc);
  completed.sort(sortByDateDesc);

  // Filter and render in one container
let allGroups = [];
if (applicationFilter === 'pending') {
  allGroups = pending;
} else if (applicationFilter === 'active') {
  allGroups = active;
} else if (applicationFilter === 'completed') {
  allGroups = completed;
} else if (applicationFilter === 'rejected') {
  allGroups = completed.filter(item => {
    // Only include rejected cards
    return item.div.innerHTML.includes('Status: Rejected');
  });
} else {
  allGroups = [...pending, ...active, ...completed];
}

  container.innerHTML = '';
allGroups.forEach(item => container.appendChild(item.div));
}

// Discard (delete) a pending application
async function discardApplication(appId, btn) {
  const confirmed = confirm('Are you sure you want to discard this application?');
  if (!confirmed) return;
  btn.disabled = true;
  const { error } = await supabase
    .from('mentor_applications')
    .delete()
    .eq('id', appId);
  if (error) {
    alert('Failed to discard application.');
    btn.disabled = false;
  } else {
    alert('Application discarded.');
    loadMenteeApplications();
  }
}

async function dissolveMentor(mentorshipId, btn) {
  const confirmed = confirm('Are you sure you want to dissolve this mentorship?');
  if (!confirmed) return;
  btn.disabled = true;

  // Get the mentorship to find the application_id
  const { data: mentorship, error: fetchError } = await supabase
    .from('mentorships')
    .select('application_id')
    .eq('id', mentorshipId)
    .single();

  if (fetchError) {
    alert('Failed to fetch mentorship.');
    console.error(fetchError);
    btn.disabled = false;
    return;
  }

  // Update mentorship status
  const { error: updateError } = await supabase
    .from('mentorships')
    .update({ status: 'completed' })
    .eq('id', mentorshipId);

  if (updateError) {
    alert('Failed to dissolve mentorship.');
    console.error(updateError);
    btn.disabled = false;
    return;
  }

  // Update the related application status to 'completed'
  if (mentorship?.application_id) {
    await supabase
      .from('mentor_applications')
      .update({ status: 'completed' })
      .eq('id', mentorship.application_id);
  }

  alert('Mentorship dissolved.');
  loadMentorAndMenteeViews();
  loadMenteeApplications();
  loadMentorApplications(); // <-- Ensure mentor view updates
}

function scrollToApplication(appId) {
  // Scroll the applications section to the top of the viewport
  const appSection = document.querySelector('.scroll-container.mentee-applications, .scroll-container.mentor-applications');
  if (appSection) {
    window.scrollTo({
      top: appSection.getBoundingClientRect().top + window.scrollY,
      behavior: 'smooth'
    });
  }

  // Highlight the application card and scroll it into view within the section
  const appCard = document.querySelector(`.application-card[data-app-id="${appId}"]`);
    console.log('Trying to scroll to appId:', appId, 'Found:', !!appCard, appCard);

  if (appCard) {
    highlightSelectedApplication(appCard);
    appCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  } else {
    console.warn('No application card found for appId:', appId);
  }

  // Highlight the application tab/filter (adjust selector as needed)
  document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
  const appTab = document.querySelector('.btn-filter[data-filter="all"]');
  if (appTab) appTab.classList.add('active');
}

function handleWithdrawClick(btn) {
  // Get mentorshipId and appId from button attributes
  const mentorshipId = btn.getAttribute('data-mentorship-id');
  const appId = btn.getAttribute('data-app-id');
  if (!mentorshipId) return;

  const confirmed = confirm('Are you sure you want to withdraw this mentorship request?');
  if (!confirmed) return;

  btn.disabled = true;
  supabase
    .from('mentorships')
    .delete()
    .eq('id', mentorshipId)
    .then(({ error }) => {
      if (error) {
        alert('Failed to withdraw request.');
        btn.disabled = false;
      } else {
        alert('Request withdrawn.');
        // Optionally reload recommendations and applications
        const app = window._menteeApplications?.find(a => a.id == appId);
        if (app) loadRecommendationsForApplication(app);
        loadMentorAndMenteeViews();
        loadMenteeApplications();
        loadMentorApplications(); // <-- Add this line
      }
    });
}

async function loadMentorApplications() {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  // 1. Fetch mentorships where you are the mentor
  const { data: mentorships, error: mentorshipsError } = await supabase
    .from('mentorships')
    .select('id, mentee_id, application_id, status')
    .eq('mentor_id', user.id);

  const container = document.querySelector('.scroll-container.mentor-applications');
  container.innerHTML = '';
  if (mentorshipsError) {
    container.innerHTML = '<div class="error">Failed to load mentorships.</div>';
    return;
  }
  if (!mentorships || mentorships.length === 0) {
    container.innerHTML = '<div class="empty">No applications found.</div>';
    return;
  }

  // 2. Collect application_ids and mentee_ids
  const appIds = mentorships.map(m => m.application_id).filter(Boolean);
  const menteeIds = mentorships.map(m => m.mentee_id).filter(Boolean);

  // 3. Fetch applications for those ids
  let appMap = {};
  if (appIds.length > 0) {
    const { data: applications, error: appError } = await supabase
      .from('mentor_applications')
      .select('*')
      .in('id', appIds);

    if (appError) {
      container.innerHTML = '<div class="error">Failed to load applications.</div>';
      return;
    }
    (applications || []).forEach(app => {
      appMap[app.id] = app;
    });
  }

  // 4. Fetch mentee profiles
  let menteeMap = {};
  if (menteeIds.length > 0) {
    const { data: mentees, error: menteeError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', menteeIds);

    if (menteeError) {
      container.innerHTML = '<div class="error">Failed to load mentee profiles.</div>';
      return;
    }
    (mentees || []).forEach(m => {
      menteeMap[m.id] = m;
    });
  }

  // 5. Prepare and render cards by status
  function renderMentorApps(filter = 'all') {
  let filtered = mentorships;
  if (filter !== 'all') {
    filtered = mentorships.filter(m => m.status === filter);
  }
    if (!filtered.length) {
      container.innerHTML = '<div class="empty">No applications found.</div>';
      return;
    }
    container.innerHTML = filtered.map(m => {
  const app = appMap[m.application_id] || {};
  const mentee = menteeMap[m.mentee_id] || {};

  // Status badge styling
  let statusHtml = `<small>Status: ${m.status ? m.status.charAt(0).toUpperCase() + m.status.slice(1) : ''}</small>`;

  // Card color styling
  let cardStyle = '';
  if (m.status === 'completed') {
    cardStyle = 'background:#f3f4f6;border:2px solid #d1d5db;opacity:1;';
  } else if (m.status === 'active') {
    cardStyle = 'background:#d1fae5;border:2px solid #10b981;opacity:1;';
  }

  return `
  <div class="application-card" data-app-id="${m.application_id}" style="${cardStyle} position:relative;">
    <strong>Name:</strong>
    <h3 style="font-weight: 400; color: #0f172a; margin: 0;">${mentee.name || 'Unknown'}</h3>
    <strong>Learning Outcome:</strong>
    <div>${app.learning_outcome || ''}</div>
    <strong>Skills:</strong>
    <div>${(app.skills || []).join(', ')}</div>
    <strong>Learning Styles:</strong>
    <div>${(app.learning_style || []).join(', ')}</div>
    <strong>Communication Modes:</strong>
    <div style="margin-bottom:0.5rem;">${(app.comm_mode || []).join(', ')}</div>
    <div style="margin-top:0.5rem;">${statusHtml}</div>
    ${
      m.status === 'pending'
        ? `<div style="margin-top:0.5rem;">
            <button class="btn btn-success" onclick="acceptMentee('${m.id}', this)">Accept</button>
            <button class="btn btn-danger" onclick="rejectMentee('${m.id}', this)">Reject</button>
          </div>`
        : m.status === 'completed'
        ? `<div style="position:absolute;top:0.5rem;left:0.5rem;">
            <i class="fa fa-lock" title="This application is completed." style="color:#6b7280;font-size:1.3rem;"></i>
           </div>`
        : m.status === 'active'
        ? `<div style="position:absolute;top:0.5rem;left:0.5rem;">
            <i class="fa fa-lock" title="This application is active." style="color:#059669;font-size:1.3rem;"></i>
           </div>
           <button class="btn btn-danger full-width" style="margin-top:0.5rem;" onclick="dissolveMentor('${m.id}', this)">
             <i class="fa fa-unlink"></i> Dissolve Mentorship
           </button>
           `
        : ''
    }
  </div>
`;
}).join(''); }

  // Initial render
  renderMentorApps();

  // Filter buttons
  document.querySelectorAll('#mentor-application-filters .btn-filter').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#mentor-application-filters .btn-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMentorApps(btn.dataset.filter);
    };
  });
};

function showMentorRecommendations(appId, mentorId = null) {
  const app = window._menteeApplications?.find(a => a.id == appId);
  if (app) {
    const recSection = document.querySelector('.scroll-container.mentor-recommendations');
    if (recSection) {
      recSection.classList.remove('hidden');
      recSection.style.display = '';
    }
    // If mentorId is provided, only show that mentor
    if (mentorId) {
      loadRecommendationsForApplication(app, [mentorId]);
    } else {
      loadRecommendationsForApplication(app);
    }
  }
}

async function loadMenteeRecommendations() {
  const recSection = document.querySelector('.scroll-container.mentee-recommendations');
  recSection.innerHTML = '<div>Loading...</div>';

  // Get current mentor's profile and skills
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  const { data: mentorProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

    // --- Add this check ---
  if (!mentorProfile || mentorProfile.accepting_applications !== true) {
 recSection.innerHTML = `
  <div class="info" style="background:#e0f2fe; color:#0369a1; border-left:4px solid #0ea5e9; padding:1.2rem 2rem; border-radius:0.5rem; margin:1.5rem 0; width:100%; max-width:none; box-sizing:border-box; text-align:left; white-space:nowrap; overflow-x:auto;">
    <i class="fa fa-info-circle" style="margin-right:0.5rem; color:#0ea5e9;"></i>
    You are not accepting applications. Toggle <b>"Actively accepting applications"</b> in your profile to see recommendations.
  </div>
`;
  return;
}
  // 1. Get all mentee applications with status 'pending'
  const { data: mentor_applications } = await supabase
    .from('mentor_applications')
    .select('*')
    .eq('status', 'pending');

  // 2. Get all mentorships (to check for active ones)
  const { data: allMentorships } = await supabase
    .from('mentorships')
    .select('application_id, status');

  // 3. Get mentorships sent by this mentor
  const { data: myMentorships } = await supabase
    .from('mentorships')
    .select('application_id, mentor_id')
    .eq('mentor_id', user.id);

  // 4. Build a set of application IDs that already have an active mentorship
  const activeAppIds = new Set((allMentorships || [])
    .filter(m => m.status === 'active')
    .map(m => m.application_id));

  // 5. Build a set of application IDs that this mentor has already sent a request to
  const sentAppIds = new Set((myMentorships || []).map(m => m.application_id));

  // 6. Filter: Only show applications that are pending, have no active mentorship, and you haven't already sent a request
  const filteredApps = (mentor_applications || []).filter(app =>
      !activeAppIds.has(app.id) &&
  !sentAppIds.has(app.id) &&
  app.user_id !== user.id //
    
  );

  // Fetch applicant profiles for filtered apps
const userIds = (filteredApps || []).map(app => app.user_id);
let userMap = {};
if (userIds.length > 0) {
  const { data: users } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', userIds);
  (users || []).forEach(u => { userMap[u.id] = u; });
}

// Compute compatibility (reuse your computeCompatibility function if available)
filteredApps.forEach(app => {
  app.score = typeof computeCompatibility === 'function'
    ? computeCompatibility(app, mentorProfile)
    : 0;
});

  // Compute compatibility (reuse your computeCompatibility function if available)
  filteredApps.forEach(app => {
    app.score = typeof computeCompatibility === 'function'
      ? computeCompatibility(app, mentorProfile)
      : 0;
  });

  // Sort by compatibility score, descending
  filteredApps.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Render cards
recSection.innerHTML = '';
if (filteredApps.length === 0) {
  recSection.innerHTML = `
  <div class="empty" style="background:#f8fafc; color:#111827; border-left:4px solid #e5e7eb; padding:1.2rem 2rem; border-radius:0.5rem; margin:1.5rem 0; width:100%; max-width:100%; box-sizing:border-box; text-align:left;">
    <i class="fa fa-info-circle" style="margin-right:0.5rem; color:#94a3b8;"></i>
    No mentee applications found that match your profile.
  </div>
`;
  return;
}
filteredApps.forEach(app => {
  const applicant = userMap[app.user_id] || {};
  const div = document.createElement('div');
  div.className = 'application-card';
  div.innerHTML = `
    <strong>Name:</strong>
    <h3 style="font-weight: 400; color: #0f172a; margin: 0;">
      ${(applicant.name) || 'Unknown'}
      <span style="font-weight:400; color:#64748b; font-size:1rem; margin-left:0.5rem;">
        (${app.score || 0}% Match)
      </span>
    </h3>
    <strong>Learning Outcome:</strong>
    <div>${app.learning_outcome || ''}</div>
    <strong>Skills:</strong>
    <div>${(app.skills || []).join(', ')}</div>
    <strong>Learning Styles:</strong>
    <div>${(app.learning_style || []).join(', ')}</div>
    <strong>Communication Modes:</strong>
    <div>${(app.comm_mode || []).join(', ')}</div>
    <button class="btn btn-primary full-width" onclick="requestMentorshipFromMentor('${app.id}', this)">
      <i class="fa fa-paper-plane"></i> Send Mentorship Request
    </button>
  `;
  recSection.appendChild(div);
});

  if (filteredApps.length === 0) {
    recSection.innerHTML = `
  <div class="empty" style="background:#f8fafc; color:#111827; border-left:4px solid #e5e7eb; padding:1.2rem 2rem; border-radius:0.5rem; margin:1.5rem 0; width:100%; max-width:100%; box-sizing:border-box; text-align:left;">
    <i class="fa fa-info-circle" style="margin-right:0.5rem; color:#94a3b8;"></i>
    No mentee applications found that match your profile.
  </div>
`;
  }
}

async function requestMentorshipFromMentor(appId, btn) {
  btn.disabled = true;
  btn.textContent = 'Sending...';
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  // Fetch the application to get the mentee's user_id
  const { data: appData, error: appFetchError } = await supabase
    .from('mentor_applications')
    .select('user_id')
    .eq('id', appId)
    .single();

  if (appFetchError || !appData) {
    btn.textContent = 'Failed';
    btn.classList.add('btn-danger');
    alert('Failed to fetch application.');
    return;
  }

  // 1. Insert mentorship with status 'active' and mentee_id
  const { error } = await supabase.from('mentorships').insert([
    { mentor_id: user.id, mentee_id: appData.user_id, application_id: appId, status: 'active' }
  ]);

  // 2. Update the mentor_applications status to 'active'
  const { error: appError } = await supabase
    .from('mentor_applications')
    .update({ status: 'active' })
    .eq('id', appId);

  if (error || appError) {
  btn.textContent = 'Failed';
  btn.classList.add('btn-danger');
  alert('Failed to send mentorship request.');
} else {
  btn.textContent = 'Mentorship Active';
  btn.classList.remove('btn-primary');
  btn.classList.add('btn-success');
  // Reload views so the new mentee appears as active
  loadMentorAndMenteeViews();
  loadMenteeApplications();
  loadMentorApplications();
}
}

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
});



async function setupGoogleMeet(menteeId, event) {
  event.stopPropagation();
  // Optionally show a loading spinner or disable the button

  // Example: Call your backend endpoint to create a Google Meet
  try {
    const response = await fetch('/api/create-google-meet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menteeId })
    });
    const data = await response.json();
    if (data.meetLink) {
      window.open(data.meetLink, '_blank');
    } else {
      alert('Failed to create Google Meet link.');
    }
  } catch (err) {
    alert('Error setting up Google Meet.');
  }
}