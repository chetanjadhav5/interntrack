/**
 * Friday Weekly Report Scheduler Service
 * Calculates recurring Friday report dates between start_date and end_date
 */

export function calculateFridayDates(startDateStr, endDateStr) {
  const start = new Date(startDateStr || new Date());
  const end = new Date(endDateStr || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000));

  const fridayDates = [];
  const cur = new Date(start);

  // Advance to the first Friday on or after the start date
  // getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  while (cur.getDay() !== 5) {
    cur.setDate(cur.getDate() + 1);
  }

  let weekNum = 1;
  while (cur <= end && weekNum <= 52) {
    const fridayDateStr = cur.toISOString().split('T')[0];
    fridayDates.push({
      week_number: weekNum,
      scheduled_friday_date: fridayDateStr,
      scheduled_date: fridayDateStr
    });

    cur.setDate(cur.getDate() + 7);
    weekNum++;
  }

  return fridayDates;
}

export function generateFridayReports(internshipId, studentId, startDateStr, endDateStr) {
  const dates = calculateFridayDates(startDateStr, endDateStr);

  return dates.map((d) => ({
    id: `rep_${internshipId}_w${d.week_number}`,
    internship_id: internshipId,
    student_id: studentId,
    week_number: d.week_number,
    scheduled_friday_date: d.scheduled_friday_date,
    scheduled_saturday_date: d.scheduled_friday_date, // compatibility alias
    scheduled_date: d.scheduled_friday_date,
    submission_date: null,
    work_summary: '',
    work_proof_urls: [],
    github_score_snapshot: null,
    status: 'PENDING',
    faculty_score: null,
    faculty_feedback: null,
    evaluated_by: null,
    evaluated_at: null
  }));
}
