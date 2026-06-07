import React from 'react';
import { styled } from '@mui/material/styles';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import { Link as RouterLink } from 'react-router-dom';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import BusinessIcon from '@mui/icons-material/Business';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import HostelIcon from '@mui/icons-material/Hotel';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Typography } from '@mui/material';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddTaskIcon from '@mui/icons-material/AddTask';
import AdjustIcon from '@mui/icons-material/Adjust';
import ApprovalIcon from '@mui/icons-material/Approval';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AutofpsSelectIcon from '@mui/icons-material/AutofpsSelect';
import BackupTableIcon from '@mui/icons-material/BackupTable';
import BathroomIcon from '@mui/icons-material/Bathroom';
import BalconyIcon from '@mui/icons-material/Balcony';
import BarChartIcon from '@mui/icons-material/BarChart';
import AvTimerIcon from '@mui/icons-material/AvTimer';
import Battery4BarIcon from '@mui/icons-material/Battery4Bar';
import BookIcon from '@mui/icons-material/Book';
import BrightnessHighIcon from '@mui/icons-material/BrightnessHigh';
import global1 from './global1';

const getlink = () => {
  return '/eventlistwithcolid/' + global1.colid;
}


const Accordion = styled((props) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': {
    borderBottom: 0,
  },
  '&::before': {
    display: 'none',
  },
}));

const AccordionSummary = styled((props) => (
  <MuiAccordionSummary
    expandIcon={<ArrowDropDownIcon />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, .05)'
      : 'rgba(0, 0, 0, .03)',
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)',
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(0, 0, 0, .125)',
}));

export function menuitemsall() {
  const open = true;
  return (
    <div style={{ overflowY: 'scroll', height: 600, width: 300, fontSize: 10 }}>

      <Accordion>
        <AccordionSummary aria-controls="panel-dashboard-content" id="panel-dashboard-header">
          <DashboardIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Dashboard</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/facultydashboard">
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Faculty dashboard" />}
          </ListItem>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel-transcript-content" id="panel-transcript-header">
          <AssignmentIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Transcription meetings</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/transcript-recorder">
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px", whiteSpace: "normal" }} primary="Audio transcript" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/transcript-meetings">
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px", whiteSpace: "normal" }} primary="Meetings calendar" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/my-transcript-meetings">
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px", whiteSpace: "normal" }} primary="My meetings" />}
          </ListItem>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel-ai-helpdesk-content" id="panel-ai-helpdesk-header">
          <AssignmentIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>AI Helpdesk</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/knowledgebase">
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px", whiteSpace: "normal" }} primary="Knowledgebase" />}
          </ListItem>
          {/* <ListItem button component={RouterLink} to="/ai-helpdesk-chatbot">
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px", whiteSpace: "normal" }} primary="AI Helpdesk Chatbot" />}
          </ListItem> */}
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel-placement-coordinator-content" id="panel-placement-coordinator-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Placement coordinator</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/placement-leads">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px", whiteSpace: "normal" }} primary="Placement leads" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/placement-lead-stage">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px", whiteSpace: "normal" }} primary="Lead stage" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/placement-visit-plan">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px", whiteSpace: "normal" }} primary="Visit plan" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/placement-visit-calendar">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px", whiteSpace: "normal" }} primary="Visit calendar" />}
          </ListItem>
        </AccordionDetails>
      </Accordion>

      {false && (
      <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>AI Chatbot</Typography>}
        </AccordionSummary>
        <AccordionDetails>




          {/* <ListItem button component={RouterLink} to="/dashchattest">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Personal data" />}
</ListItem> */}

          {/* <ListItem button component={RouterLink} to="/dashmchatentry">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="AI Chatbot" />}
</ListItem> */}

          <ListItem button component={RouterLink} to="/dashchattest4d">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AI Chatbot" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashchattestadmin">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AI Admin Chatbot" />}
          </ListItem>

           {/* <ListItem button component={RouterLink} to="/apichatbot">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AI Report Chatbot" />}
          </ListItem> */}

          <ListItem button component={RouterLink} to="/apichatbot1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AI Report Advanced" />}
          </ListItem>

           <ListItem button component={RouterLink} to="/aidatamanager">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AI Chat Upload" />}
          </ListItem>


           <ListItem button component={RouterLink} to="/workflowchatbotds1">
      <ListItemIcon>
        <SettingsIcon />
      </ListItemIcon>
      {open && (
        <ListItemText
          primaryTypographyProps={{ fontSize: '14px' }}
          primary="AI Advanced Work Flow Chatbot"
        />
      )}
    </ListItem>

     <ListItem button component={RouterLink} to="/workflowconfigds1">
      <ListItemIcon>
        <SettingsIcon />
      </ListItemIcon>
      {open && (
        <ListItemText
          primaryTypographyProps={{ fontSize: '14px' }}
          primary="AI Advanced Work Flow Config"
        />
      )}
    </ListItem>

          

          <ListItem button component={RouterLink} to="/workflowchatbotds">
      <ListItemIcon>
        <SettingsIcon />
      </ListItemIcon>
      {open && (
        <ListItemText
          primaryTypographyProps={{ fontSize: '14px' }}
          primary="AI Work Flow Chatbot"
        />
      )}
    </ListItem>
    <ListItem button component={RouterLink} to="/workflowconfigds">
      <ListItemIcon>
        <SettingsIcon />
      </ListItemIcon>
      {open && (
        <ListItemText
          primaryTypographyProps={{ fontSize: '14px' }}
          primary="AI Work Flow Config"
        />
      )}
    </ListItem>

           <ListItem button component={RouterLink} to="/dataconfig">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AI Chat Config" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/apiconfig">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AI API Config" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmtall">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Config Tables" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmtfields">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Config Fields" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmtbcolumnsall">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Columns" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmtblapi">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="API Configuration" />}
          </ListItem>




        </AccordionDetails>
      </Accordion>
      )}

       {false && (
       <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>AI Agents</Typography>}
        </AccordionSummary>
        <AccordionDetails>

           <ListItem button component={RouterLink} to="/dashmtblemitter">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AI Agents" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmtblerrorlog">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Error Logs" />}
          </ListItem>

        </AccordionDetails>
        </Accordion>
       )}

      <Accordion>
        <AccordionSummary aria-controls="panel-wizard-content" id="panel-wizard-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Wizard</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/configuration">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Configuration Wizard" />}
          </ListItem>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Academic Configuration</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          {/* <ListItem button component={RouterLink} to="/dashmmprograms">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Master Program List" />}
          </ListItem> */}
          <ListItem button component={RouterLink} to="/programmanagement">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Program Management" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/regulationmaster">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Regulation" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/regulationsubjects">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Regulation Subjects" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/regulationseats">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Regulation Seat Matrix" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/regulationcoursemap">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Regulation Course Map" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/courseassessment">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Course Assessment" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/syllabus">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Syllabus" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/colist">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="CO list" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/gradeconfiguration">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Grade configuration" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/relativegradingconfiguration">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Relative grading configuration" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/zscoreconfiguration">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Z score configuration" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/academicsubjects">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admission configuration" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/academiccalendar">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Academic Calendar" />}
          </ListItem>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>User management</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/menuaccesscontrol">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Menu access control" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/usercustomfields">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="User custom fields" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/userdataupload">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="User data upload" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/studentdataupload">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student data upload" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/studentdetails">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student details" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/studentpromotion">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student promotion" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/admissioncancellation">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admission cancellation" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/admissionrefunddetails">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Refund details" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/admissionrefundletter">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Generate refund letter" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/studentemailmessage">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student email message" />}
          </ListItem>

          {open && (
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary", px: 2, pt: 1, pb: 0.5 }}>
              User database
            </Typography>
          )}

          <ListItem button component={RouterLink} to="/employeedatabase">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Employee database" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/employeedatabasereport">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Employee database report" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/employeeprofileedit">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Edit profile" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/mbuser">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Non student user" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/student-dynamic-filter">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student admission filter" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/userpivotreport">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="User pivot report" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/userpivotcount">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="User pivot count" />}
          </ListItem>

        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel-crm-content" id="panel-crm-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>CRM</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/crm-my-leads">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="My leads" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/crm-my-followups">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="My followup" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/crm-counselor-mapping">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Counselor mapping" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/crm-management">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="CRM masters and leads" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/crm-lead-actions">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Lead update" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/crm-reports">
            <ListItemIcon>
              <BarChartIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="CRM reports" />}
          </ListItem>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Admission</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          {/* <ListItem button component={RouterLink} to="/dashmadmission">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Form link" />}
          </ListItem> */}

          {/* <ListItem button component={RouterLink} to="/leadtouserds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admission from CRM" />}
          </ListItem> */}

          <ListItem button component={RouterLink} to="/admit-from-crm">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admit from CRM" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dynamic-admission-form">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Dynamic admission form" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/admission-address-configuration">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Address configuration" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/admission-board-configuration">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Board configuration" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/admission-validation-criteria">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Validation criteria" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/admission-form-documents">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Form documents" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dynamic-admission-applications">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admission applications" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/admission-application-management">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Application management" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/admission-datewise-summary">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admission datewise summary" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/admission-payments">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admission Payments" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/admission-fee-receipt">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admission fee receipt" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/subject-wise-admission">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Subject wise admission" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dynamic-admission-sort">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admission sort" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dynamic-admission-bulk-upload">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admission bulk upload" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/program-eligibility">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Program eligibility" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dynamic-admission-to-user">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admit application to user" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/provisional-admission-letter">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Generate Provisional Admission letter" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/offer-letter">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Generate Offer Letter" />}
          </ListItem>

          {/* <ListItem button component={RouterLink} to="/dashmappmodel2">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Merit List All" />}
          </ListItem> */}

          {/* <ListItem button component={RouterLink} to="/dashmappmodel2cat">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Merit List by Category" />}
          </ListItem> */}

           {/* <ListItem button component={RouterLink} to="/pucadmissionform">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="PU admission" />}
          </ListItem> */}

          {/* <ListItem button component={RouterLink} to="/applicationreviewpage">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Confirm admission" />}
          </ListItem> */}

        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary aria-controls="panel-student-activities-content" id="panel-student-activities-header">
          <AssignmentIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Student activities</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/studentactivities">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Extra curricular activities" />}
          </ListItem>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary aria-controls="panel-workload-content" id="panel-workload-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Workload</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/workloadassignment">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Workload assignment" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/workloaddynamicreport">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Dynamic workload report" />}
          </ListItem>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary aria-controls="panel-examination-marks-content" id="panel-examination-marks-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Examination marks</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/neplmsassessmentmarks">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Assessment marks entry" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/neplmsassessmentmarksview">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Assessment marks view" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/neplmscomponentmarks">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="View componentwise marks" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/neplmsfinalmarks">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="View final marks" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/neplmsfinalmarksedit">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Edit Final marks" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/neplmsgradecard">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Generate grade card" />}
          </ListItem>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary aria-controls="panel-neplms-content" id="panel-neplms-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>NEP LMS</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/neplmsassignedcourses">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="My assigned courses" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/neplmscourseworkspace">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Course workspace" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/neplmsassessment">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Assessment" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/neplmsremedial">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Remedial" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/neplmsaicoursegeneration">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AI course generation" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/neplmstimetablemanager">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Timetable manager" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/neplmsattendance">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Attendance" />}
          </ListItem>

          {/* <ListItem button component={RouterLink} to="/neplmsassessmentmarks">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Assessment marks entry" />}
          </ListItem> */}

          {/* <ListItem button component={RouterLink} to="/neplmsassessmentmarksview">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Assessment marks view" />}
          </ListItem> */}

          {/* <ListItem button component={RouterLink} to="/neplmscomponentmarks">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="View componentwise marks" />}
          </ListItem> */}

          {/* <ListItem button component={RouterLink} to="/neplmsfinalmarks">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="View final marks" />}
          </ListItem> */}

          {/* <ListItem button component={RouterLink} to="/neplmsgradecard">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Generate grade card" />}
          </ListItem> */}

          <ListItem button component={RouterLink} to="/neplmsstudentwiseattendance">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Studentwise attendance report" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/neplmsstudentcoursewiseattendance">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student coursewise attendance" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/neplmslowattendance">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Low attendance report" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/neplmsfacultycourselowattendance">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Faculty course low attendance" />}
          </ListItem>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary aria-controls="panel-bos-content" id="panel-bos-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>BoS</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/boscycle">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="BoS Cycle" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/bosapprovalmatrix">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Approval matrix" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/bosassignment">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="BoS assignment" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/boscoursereview">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Course review" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/boscourseapproval">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Course approval" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/bosprogramreview">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Program review" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/bosreport">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="BoS report" />}
          </ListItem>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary aria-controls="panel-conduct-exam-content" id="panel-conduct-exam-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Conduct Examination</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/conduct-exam-master">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Create exam" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/conduct-exam-rooms">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Seat master" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/conduct-exam-courses">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Exam course mapping" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/conduct-exam-course-scheduler">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Exam course scheduler" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/examroll">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Exam roll" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/conduct-exam-seat-allocation">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Seat allocation" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/conduct-exam-invigilation">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Invigilation details" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/conduct-exam-invigilator-allocation">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Invigilator allocation" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/conduct-exam-invigilator-attendance">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Invigilator attendance" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/conduct-exam-student-attendance">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Mark student attendance" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/conduct-exam-invigilator-payment">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Invigilator payment" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/conduct-exam-examiner-list">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Examiner list" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/conduct-exam-examiner-allotment">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Examiner allotment" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/conduct-exam-examiner-allotment-report">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Examiner allotment report" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/conduct-exam-examiner-marks-entry">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Examiner marks entry" />}
          </ListItem>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary aria-controls="panel-mentoring-content" id="panel-mentoring-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Mentoring</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/mentoringworkspace">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Mentoring workspace" />}
          </ListItem>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary aria-controls="panel-hostelmapping-content" id="panel-hostelmapping-header">
          <HostelIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Hostel Mapping</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/hostelbuildingrooms">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Hostel buildings and rooms" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/hostelassignment">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Hostel assignment" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/hostelvacancyreport">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Hostel vacancy report" />}
          </ListItem>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Fees</Typography>}
        </AccordionSummary>
        <AccordionDetails>


          <ListItem button component={RouterLink} to="/dashmfeebook">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Feebook" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmcashbook">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Cashbook" />}
</ListItem>





          {/*
          <ListItem button component={RouterLink} to="/dashmfees">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Fee configuration" />}
          </ListItem>
          */}

          <ListItem button component={RouterLink} to="/mfeesconfig">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Fee configuration regulation" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/feeapprovalroles">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Fee Approval Roles" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/feeapproval">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Fee Approval" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/feeapplication">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Fee Application" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/feesmodelreport">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Fees Model Report" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/feeitemreport">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Fees Item report" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/applicationfee">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Application fee" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/provisionaladmissionfee">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Provisional Admission fee" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/studentledgerapprovalroles">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student Ledger Approval Roles" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/studentledgerapproval">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student Ledger Approval" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/studentledgeradjustment">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student Ledger Adjustment" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/studentledgeranalytics">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student Ledger Analytics" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/studentledgerdetail">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student ledger" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/studentledgerpaidanalytics">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Paid Date Ledger Analytics" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/feespivot">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Fees pivot" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/feespivot2">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Fees pivot 2" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/feespaidreport">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Fees paid report" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/studentledgercounterpayment">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Counter Fee Payment" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/studentfeesreceipt">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Fees Receipt" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/studentfeeapply">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Apply Fee to Student" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/studentledgerinstallment">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Installment" />}
          </ListItem>

          {/*
          <ListItem button component={RouterLink} to="/dashmledgerstud">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student Ledger" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmmfeescol">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Fees collection" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmfeespay">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Fees payment" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmfeespayl">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Counter Fees payment" />}
          </ListItem>

           <ListItem button component={RouterLink} to="/feesummaryreport">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Fee Summary report" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/studentledgerreport">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Studentwise Ledger report" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/programfeereport">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Programwise fee received" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dailyfeesreport1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Daily Collection Report 2" />}
          </ListItem>


          <ListItem button component={RouterLink} to="/revenuedashboard">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Revenue dashboard" />}
          </ListItem>

            <ListItem button component={RouterLink} to="/feecreport">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Programwise Cashbook report" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmmfeescolbydate">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Fees Datewise" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashfeescolaggr">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Fees Datewise Total" />}
          </ListItem>


          <ListItem button component={RouterLink} to="/studentledgerreportds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Studentwise Pending" />}
          </ListItem>


          <ListItem button component={RouterLink} to="/collegerepledgerreportds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Programwise Pending" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/ledgerstudpageds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Installments" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/ledgerinstallmentpageds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Installments student ledger" />}
          </ListItem>
          */}



        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel-paymentgateway-content" id="panel-paymentgateway-header">
          <AccountBalanceWalletIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Payment gateway</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/mastergateway">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Master gateway list" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/easebuzzgateway">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Easebuzz gateway" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/icicigateway">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="ICICI configuration" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/easebuzzpaymentprocess">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Payment processing" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/easebuzzpaymentview">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Easebuzz payment view" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/icicipaymentview">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="ICICI payment view" />}
          </ListItem>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel-purchase2-content" id="panel-purchase2-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Purchase 2</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          {[
            ["/purchase2/storemasterds2", "Store master"],
            ["/purchase2/storeitemds2", "Store items"],
            ["/purchase2/storecashaccountds2", "Store cash account"],
            ["/purchase2/storeuserds2", "Store users"],
            ["/purchase2/storerequisationds2", "Store requisition"],
            ["/purchase2/storepoorderds2", "Store PO order"],
            ["/purchase2/storepoitemsds2", "Store PO items"],
            ["/purchase2/storepoapprovalds2", "Store PO approval"],
            ["/purchase2/vendords2", "Vendors"],
            ["/purchase2/vendoritemds2", "Vendor items"],
            ["/purchase2/vendorpayschds", "Vendor payment schedule"]
          ].map(([to, label]) => (
            <ListItem button component={RouterLink} to={to} key={to}>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              {open && <ListItemText primaryTypographyProps={{ fontSize: "14px", whiteSpace: "normal" }} primary={label} />}
            </ListItem>
          ))}
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel-hrleave-content" id="panel-hrleave-header">
          <AccountBalanceWalletIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>HR Leave</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          {[
            ["/hrleavehierarchy", "Approval hierarchy"],
            ["/hrleavetypes", "Leave type master"],
            ["/hrleavecycle", "Leave cycle"],
            ["/hrleavebalance", "Leave balance"],
            ["/hrleavereset", "Leave reset"],
            ["/hrleaveapply", "Apply leave"],
            ["/hrleaveapprove", "Approve leave"],
            ["/hrleavedashboard", "Leave dashboard"],
            ["/hrleavehrdashboard", "HR leave dashboard"]
          ].map(([to, label]) => (
            <ListItem button component={RouterLink} to={to} key={to}>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary={label} />}
            </ListItem>
          ))}
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel-hrattendance-content" id="panel-hrattendance-header">
          <AccountBalanceWalletIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>HR Attendance</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          {[
            ["/hremployeeattendance", "Employee attendance"],
            ["/hremployeeattendancematrix", "Attendance approval matrix"],
            ["/hremployeeattendanceapproval", "Attendance approval"]
          ].map(([to, label]) => (
            <ListItem button component={RouterLink} to={to} key={to}>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary={label} />}
            </ListItem>
          ))}
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel-budget-content" id="panel-budget-header">
          <AccountBalanceWalletIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Budget</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/categorypage">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Category" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/budgetpage">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Budget" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/indbudgetapprovalroles">
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Budget Approval Roles" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/prepdashboard">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Budget analysis" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/budgetlog">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Budget Log" />}
          </ListItem>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel-research-content" id="panel-research-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Research and Seed fund</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/researchapprovalmatrix">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Approval matrix" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/researchcomponents">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Research components" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/researchgrantapply">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Apply research grant" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/researchgrantapproval">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Research grant approval" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/researchgrantsummary">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Research grant summary" />}
          </ListItem>
        </AccordionDetails>
      </Accordion>



      {/*
      <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Reports</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/institutionsds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Manage institutions" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashreports">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Other Reports" />}
          </ListItem>

        </AccordionDetails>
      </Accordion>
      */}


      {/*
      <Accordion>
        <AccordionSummary aria-controls="panel1-content" id="panel1-header">
          <AccountCircleIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Dashboard</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/facultydashboardds">
<ListItemIcon>
<AccountBalanceWalletIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: '14px'}} primary="Dashboard" style={{ overflow:'scroll'}} />}
</ListItem>

          <ListItem button component={RouterLink} to="/dashdashfacnew">
            <ListItemIcon>
              <AccountBalanceWalletIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Dashboard" style={{ overflow: 'scroll' }} />}
          </ListItem>

        </AccordionDetails>
      </Accordion>
      */}


      <Accordion>
        <AccordionSummary aria-controls="panel1-content" id="panel1-header">
          <AccountCircleIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Personal CAS data</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashmprojects">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Projects" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmpublications">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Publications" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmpatents">
            <ListItemIcon>
              <AcUnitIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Patents" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmteacherfellow">
            <ListItemIcon>
              <AccountBalanceWalletIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Fellowship and awards" style={{ overflow: 'scroll' }} />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmconsultancy">
            <ListItemIcon>
              <AddTaskIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Consultancy" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmphdguide">
            <ListItemIcon>
              <AdjustIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="PhD Guideship" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmseminar">
            <ListItemIcon>
              <AutoModeIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Seminars participated" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmbook">
            <ListItemIcon>
              <ApprovalIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Books and chapters" />}
          </ListItem>




          <ListItem button component={RouterLink} to="/dashmncas11">
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Classes taken" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmncas12">
            <ListItemIcon>
              <AutoStoriesIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Activities taken" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmncas22">
            <ListItemIcon>
              <AutofpsSelectIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Publication (CAS)" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmncas241">
            <ListItemIcon>
              <BackupTableIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Research guidance" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmncas242">
            <ListItemIcon>
              <BathroomIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Completed Projects" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmncas243">
            <ListItemIcon>
              <BarChartIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Ongoing Projects" style={{ overflow: 'scroll' }} />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmncas251">
            <ListItemIcon>
              <BalconyIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Patents" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmncas252">
            <ListItemIcon>
              <AvTimerIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Policy Document" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmncas26">
            <ListItemIcon>
              <Battery4BarIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Participation" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmncas253">
            <ListItemIcon>
              <BookIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Awards or Fellowship" />}
          </ListItem>


          <ListItem button component={RouterLink} to="/dashmncas23">
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="ICT (CAS)" />}
          </ListItem>




        </AccordionDetails>
      </Accordion>

      {/* <Accordion>
        <AccordionSummary aria-controls="panel4-content" id="panel4-header">
          <HostelIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{fontSize: 14}}>Teaching Learning</Typography>}
        </AccordionSummary>
        <AccordionDetails>
        <ListItem button component={RouterLink} to="/dashmclassenr1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Class enrollment" />}
</ListItem>


       
        </AccordionDetails>
      </Accordion> */}

       {/*
       <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Bell curve relative grading</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/bellconfig">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Bell config" />}
          </ListItem>

           <ListItem button component={RouterLink} to="/belldashboard">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Bell dashboard" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/bellupload">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Bell upload" />}
          </ListItem>

           <ListItem button component={RouterLink} to="/belluploadnew">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Bell upload new" />}
          </ListItem>

           <ListItem button component={RouterLink} to="/belldashboardnew">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Bell dashboard new" />}
          </ListItem>

           <ListItem button component={RouterLink} to="/rbellconfig">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Dual mode config" />}
          </ListItem>

           <ListItem button component={RouterLink} to="/rbellupload">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Add student marks" />}
          </ListItem>

           <ListItem button component={RouterLink} to="/rbelldashboard">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Dual mode dashboard dashboard new" />}
          </ListItem>

        </AccordionDetails>
        </Accordion>
        */}



      <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Examination CoE</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          {/* <ListItem button component={RouterLink} to="/dashmmprograms">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Master Program List" />}
</ListItem>
<ListItem button component={RouterLink} to="/dashmmcourseslist">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Master course list offered" />}
</ListItem>

 <ListItem button component={RouterLink} to="/dashmmstudents1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Master student list" />}
</ListItem> */}
          <ListItem button component={RouterLink} to="/dashmexamschedule">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Exam schedule" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmexamtimetable">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Exam time table" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmexamtimetable">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Exam Timetable Filter" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmexamroom">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Exam Seat allotment" />}
          </ListItem>

          {/* <ListItem button component={RouterLink} to="/seatallocator1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Seat allocation Single" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/seatallocatorm1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Seat allocation Multiple" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/seatallocatorm2">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Seat allocation Multiple 2" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/seatallocatorm3">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Seat allocation Multiple 3" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/seatallocatorm4">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Seat allocation Multiple 4" />}
          </ListItem> */}



          <ListItem button component={RouterLink} to="/seatallocatormds4">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Seat allocation export" />}
          </ListItem>

           <ListItem button component={RouterLink} to="/dashmexamnewrubrics1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Internal marks entry (template 1)" />}
</ListItem>

 <ListItem button component={RouterLink} to="/dashmexamext1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="External marks" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmexamtotal1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Total marks" />}
</ListItem>
<ListItem button component={RouterLink} to="/examtransfer">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Transfer marks" />}
</ListItem>


          {/* <ListItem button component={RouterLink} to="/seatallocatorm5">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Seat allocation Multiple 5" />}
</ListItem> */}

          <ListItem button component={RouterLink} to="/dashmexamadmit">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Exam registration" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/mainrubric">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Marks entry all (1)" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/addrubric1bulk">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Marks entry bulk (1)" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/addrubric1bulkedit">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Marks entry edit bulk (1)" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/rubricexampage1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Marks entry all (2)" />}
          </ListItem>


          <ListItem button component={RouterLink} to="/dashworkloadn1faculty">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Marks entry IA" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmexammarksall">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Exam marks" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/finalize">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Finalize (1)" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/finalizedata1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Finalize (2)" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/examstructurepageds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Exam configuration" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/marksentrypageds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Marks entry rubrics" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/tabulationregisterpageds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Tabulation register" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/bulktabulationregisterpageds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Tabulation register bulk" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/transcriptpageds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Examination Student Transcript" />}
          </ListItem>



        </AccordionDetails>
      </Accordion>


      <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Question Bank</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/questionbanklistds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Question Bank" />}
          </ListItem>



        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Digital evaluation</Typography>}
        </AccordionSummary>
        <AccordionDetails>



          <ListItem button component={RouterLink} to="/facultyregistrationform">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Examiner registration" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/facultyregistrationmanagement">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Examiner registration management" />}
          </ListItem>


          <ListItem button component={RouterLink} to="/dashmexamupload">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Upload students" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmexaminerallocate">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Digital Examination dashboard" />}
          </ListItem>

          {/* <ListItem button component={RouterLink} to="/facultyregistrationform">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Examiner registration" />}
</ListItem> */}

          {/* <ListItem button component={RouterLink} to="/dashmstudalloc1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Student list" />}
</ListItem> */}

          {/* <ListItem button component={RouterLink} to="/dashmstudallocf">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Examiner list" />}
</ListItem> */}

          <ListItem button component={RouterLink} to="/dashmstudalloc1exam">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Examiner portal" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashboardsummary">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="At a glance" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/coursefacultyassigned">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Faculty assignment" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/facultycoursesummary">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Faculty course summary" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/facultyoverallsummary">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Faculty overall summary" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/coursecompletionstatus">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Course completion status" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/facultycoursestudentdetails">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Faculty course details" />}
          </ListItem>



        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Reevaluation</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashboardreevalds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Dashboard" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/examinerconfigds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Examiner config" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/examinerevaluationds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Examiner evaluation" />}
          </ListItem>

        </AccordionDetails>
      </Accordion>

      

{/* Exam New */}
      <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Exam School</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/marksheetdataentryds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Exam Marks Entry" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/marksheetgenerationds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Generate Marksheet" />}
          </ListItem>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Appraisal</Typography>}
        </AccordionSummary>
        <AccordionDetails>

           <ListItem button component={RouterLink} to="/dashmkeiyear">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Appraisal year" />}
          </ListItem>

            <ListItem button component={RouterLink} to="/keiaddquestion">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Questions" />}
          </ListItem>

           <ListItem button component={RouterLink} to="/dashmkeiquestionModel">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="KEI Questions" />}
</ListItem>

<ListItem button component={RouterLink} to="/dashmkeiyearmy">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="My Appraisal year" />}
          </ListItem>


           <ListItem button component={RouterLink} to="/keiteacherformsall">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Appraisal form" />}
          </ListItem>

           <ListItem button component={RouterLink} to="/keiteacherperformancs">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Appraisal report" />}
          </ListItem>

           <ListItem button component={RouterLink} to="/keifacultyreport">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Faculty Appraisal" />}
          </ListItem>

        </AccordionDetails>
        </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>CRM</Typography>}
        </AccordionSummary>
        <AccordionDetails>

           <ListItem button component={RouterLink} to="/dashboardcrmds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="CRM Dashboard" />}
          </ListItem>

         

          <ListItem button component={RouterLink} to="/Dashmcrmh1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="CRM leads" />}
          </ListItem>

           <ListItem button component={RouterLink} to="/oicrmrep2">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="CRM reports 1" />}
          </ListItem>


           <ListItem button component={RouterLink} to="/crmreports2">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="CRM reports 2" />}
          </ListItem>

           <ListItem button component={RouterLink} to="/crmupcommingfollowup">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Upcomming Followups" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/crmds-overdue-leads">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Overdue Leads" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/crmds-counsellor-wise-leads">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Counsellor Wise Leads" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/crmds-pipeline-stage-wise">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Pipeline Stage Wise" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/crmds-source-wise-leads">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Source Wise Leads" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/crmdatewisenewleads">
            <ListItemIcon>
             <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Date Wise New Leads" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmcrmstage">
            <ListItemIcon>
             <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Counsellor lead status" />}
          </ListItem>
           <ListItem button component={RouterLink} to="/dashmcrmstage">
                      <ListItemIcon>
                         <PersonIcon />
                      </ListItemIcon>
                      {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Counselor stage wise" />}
                    </ListItem>
           <ListItem button component={RouterLink} to="/viewcrmstagepivot2">
                      <ListItemIcon>
                         <PersonIcon />
                      </ListItemIcon>
                      {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Counsellot stage pivot 2" />}
                    </ListItem>


        </AccordionDetails>
      </Accordion>



       <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Alumni interaction</Typography>}
        </AccordionSummary>
        <AccordionDetails>

            <ListItem button component={RouterLink} to="/admin/alumni/dashboard">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Alumni dashboard" />}
          </ListItem>



        </AccordionDetails>
        </Accordion>




      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>AI report generation</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/viewmmcevents">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Generate douments" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/viewmmcevmed">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Generate prescriptions" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/viewmmcevmeddis">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Generate discharge summary" />}
          </ListItem>


        </AccordionDetails>
      </Accordion>



      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Student profile</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashstudprofileall">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student profile" />}
          </ListItem>


        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>ID Card Manager</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/idcardmanager">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="ID Card manager" />}
          </ListItem>

        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Certificates</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/createcertificates">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Certificates" />}
          </ListItem>

        </AccordionDetails>
      </Accordion>

      {/* <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{fontSize: 14}}>ID Card Manager</Typography>}
        </AccordionSummary>
        <AccordionDetails>

           <ListItem button component={RouterLink} to="/idcardmanager">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="ID Card manager" />}
</ListItem>

        </AccordionDetails>
        </Accordion> */}

         <Accordion>
                <AccordionSummary aria-controls="panel-budget-content" id="panel-budget-header">
                  <AccountBalanceWalletIcon sx={{ marginRight: 1 }} />
                  {open && <Typography sx={{ fontSize: 14 }}>Budget Management</Typography>}
                </AccordionSummary>
                <AccordionDetails>
                  <ListItem button component={RouterLink} to="/BudgetDashboardds">
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Budget Dashboard" />}
                  </ListItem>
                  <ListItem button component={RouterLink} to="/BudgetApprovalds">
                    <ListItemIcon>
                      <ApprovalIcon />
                    </ListItemIcon>
                    {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Budget Approval" />}
                  </ListItem>
                  <ListItem button component={RouterLink} to="/BudgetTypeds">
                    <ListItemIcon>
                      <SettingsIcon />
                    </ListItemIcon>
                    {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Budget Types" />}
                  </ListItem>
                  <ListItem button component={RouterLink} to="/BudgetApproverds">
                    <ListItemIcon>
                      <SettingsIcon />
                    </ListItemIcon>
                    {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Budget Approvers" />}
                  </ListItem>
                </AccordionDetails>
              </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Finance and Accounts</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/accountgroup">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Account group" />}
          </ListItem>

          {/* <ListItem button component={RouterLink} to="/accountds">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Accounts" />}
</ListItem> */}


          <ListItem button component={RouterLink} to="/mjournal2">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Journal entry" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmmjournal2">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Journal" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/mjournal2reportpage">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Journal reports" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/journalsbygroupds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Group reports" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/transactionrefds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Transaction by reference" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmmtrialbalance2">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Trial balance" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/trialbalancepage">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Generate Trial balance" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmmtradinggenerate">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Generate Trading Account" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmmtradingaccount">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Trading Account" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmmplaccount">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Profit and Loss Account" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmmbalancesheet">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Balance Sheet" />}
          </ListItem>


          {/* <ListItem button component={RouterLink} to="/balancesheetpage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Balance sheet" />}
</ListItem> */}

        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>New registration</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/generateinstitutecode">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Generate code" />}
          </ListItem>

        </AccordionDetails>
      </Accordion>

     

      <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Scholarship</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/CreateScholarshipDS">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Create scholarship" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/ScholarshipAdminDS">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Manage applications" />}
          </ListItem>

        </AccordionDetails>
      </Accordion>



      {/*
      <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>User data management</Typography>}
        </AccordionSummary>
        <AccordionDetails>


          <ListItem button component={RouterLink} to="/admin/users">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="User data management" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/admin/admin-passwords">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admin passwords" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/usermanagementdsoct18">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="User management 2" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/usermanagementdsnov17">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="User management 3" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/createuserdsoct18">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Create user" />}
          </ListItem>

            <ListItem button component={RouterLink} to="/studentmasterlistds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Promotion" />}
          </ListItem>


          <ListItem button component={RouterLink} to="/profileeditconfigds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Profile edit" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/profileeditlogsds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Profile edit log" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dataqualityreportds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Data quality report" />}
          </ListItem>





        </AccordionDetails>
      </Accordion>
      */}

       <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Convocation</Typography>}
        </AccordionSummary>
        <AccordionDetails>

           <ListItem button component={RouterLink} to="/dashmconvdates">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Convocation master" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmconvdocs">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Convocation douments" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmconvfees">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Convocation fees" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmconvgh">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Guest house allotment" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmconvtransport">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Transport requirements" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmconvguests">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Convocation guests" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmconvattendees">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Year" />}
</ListItem>


        </AccordionDetails>
        </Accordion>

      {/* <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Purchasing</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/vendormanagementds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Vendor management" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/productmanagementds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Product management" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/vendorproductmanagementds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Vendor Product management" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/productrequestds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Product requisition" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/productrequestadminds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Approve requisition" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/purchasemanagementds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Purchase management" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/paymentmanagementds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Purchase payment" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/purchasedsearchds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Past PO search" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/returnmanagementds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Product return" />}
          </ListItem>





        </AccordionDetails>
      </Accordion>

       <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Purchasing and Store</Typography>}
        </AccordionSummary>
        <AccordionDetails>

           <ListItem button component={RouterLink} to="/dashboard-purchasing">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="New dashboard" />}
</ListItem>

           <ListItem button component={RouterLink} to="/dashmvendords">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Vendor master" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmvendoritemds">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Vendor items list" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmrequisationds">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Faculty requisition" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmitemmasterds">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Item master" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmstoreitemds">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Store Inventory" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmstorerequisationds">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Store requisition" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmstorepoorderds">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Store PO" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmstorepoitemsds">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="PO Items" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmstockregisterds">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Stock register" />}
</ListItem>


        </AccordionDetails>
        </Accordion>

 */}

      {/*
      <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>NEP Subject Select</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/subjectlimitconfig">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Subject limit" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/subjectgroupds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Subject group" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/subjectApprovalds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Subject Approval" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/subjectreportds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Subject Reports" />}
          </ListItem>



        </AccordionDetails>
      </Accordion>
      */}



      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Grievance management</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/managegrievancecategoriesds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Grievance Categories" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/managecategoryassigneeds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Assign Categories" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/admingrievancedashboardds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Grievance management" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/creategrievanceds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Create Grievance" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/assigneegrievancepageds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Grievance assignment" />}
          </ListItem>



        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>IT Service Management</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/manageapikeyds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Gemini API Key" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/managegrievancecategoriesds1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Grievance Categories" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/managecategoryassigneeds1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Assign Categories" />}
          </ListItem>


          <ListItem button component={RouterLink} to="/admingrievancedashboardds1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Grievance Management" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/geminichatds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Chat to Solve" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/creategrievanceds1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Create ticket" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/assigneegrievancepageds1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Assign ticket" />}
          </ListItem>





        </AccordionDetails>
      </Accordion>

      {/* <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{fontSize: 14}}>Exam Admit Card</Typography>}
        </AccordionSummary>
        <AccordionDetails>

           <ListItem button component={RouterLink} to="/examapplicationform">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Student Registration form" />}
</ListItem>



  <ListItem button component={RouterLink} to="/approvesubjects">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Approve subjects" />}
</ListItem>

 <ListItem button component={RouterLink} to="/admitcardtemplate">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Admit card template" />}
</ListItem>

 <ListItem button component={RouterLink} to="/releaseadmitcard">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Release admit card" />}
</ListItem>

<ListItem button component={RouterLink} to="/downloadadmitcard">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Download link" />}
</ListItem>

        </AccordionDetails>
        </Accordion> */}

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Library</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          {/* <ListItem button component={RouterLink} to="/createlibraryform">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Create library" />}
</ListItem> */}

          <ListItem button component={RouterLink} to="/dashlibraryform">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Create library" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/admin/libraries">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Library administration" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/library/:id/issuedbooks">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Issue books" />}
          </ListItem>






        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Task assignment</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          {/* <ListItem button component={RouterLink} to="/taskmanager">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Task manager" />}
</ListItem> */}

          <ListItem button component={RouterLink} to="/taskcreatorpage">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Create Task" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/assigneetaskpage">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="My Tasks" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/approvertaskpage">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Approve Tasks" />}
          </ListItem>

        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel1-content" id="panel1-header">
          <AccountCircleIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Forum</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/topiccategorypage1ds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="All Forum" />}
          </ListItem>


        </AccordionDetails>
      </Accordion>



      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Hostel</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          {/* <ListItem button component={RouterLink} to="/hostelbuldingmanager">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Hostel" />}
</ListItem> */}

          <ListItem button component={RouterLink} to="/dashboardpagehostel">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Hostel Dashboard" />}
          </ListItem>



        </AccordionDetails>
      </Accordion>

       {/* <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Admission Allotment</Typography>}
        </AccordionSummary>
        <AccordionDetails>

           <ListItem button component={RouterLink} to="/dashboardmeritlist">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Dashboard" />}
          </ListItem>

        </AccordionDetails>
        </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Merit list GJ</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/meritlist">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admission data upload" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/meritlistselection">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admission selection" />}
          </ListItem>

        </AccordionDetails>
      </Accordion> */}

      {/* Original Admission group moved after User management. */}
      {false && (
      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Admission</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          {/* <ListItem button component={RouterLink} to="/dashmadmission">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Form link" />}
          </ListItem> */}

          {/* <ListItem button component={RouterLink} to="/leadtouserds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admission from CRM" />}
          </ListItem> */}

          <ListItem button component={RouterLink} to="/admit-from-crm">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admit from CRM" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dynamic-admission-form">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Dynamic admission form" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/admission-validation-criteria">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Validation criteria" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dynamic-admission-applications">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admission applications" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dynamic-admission-sort">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admission sort" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dynamic-admission-bulk-upload">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admission bulk upload" />}
          </ListItem>

          {/* <ListItem button component={RouterLink} to="/student-dynamic-filter">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student admission filter" />}
          </ListItem> */}

          <ListItem button component={RouterLink} to="/program-eligibility">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Program eligibility" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dynamic-admission-to-user">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admit application to user" />}
          </ListItem>



          {/* <ListItem button component={RouterLink} to="/dashmappmodel2">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Merit List All" />}
          </ListItem> */}

          {/* <ListItem button component={RouterLink} to="/dashmappmodel2cat">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Merit List by Category" />}
          </ListItem> */}

           {/* <ListItem button component={RouterLink} to="/pucadmissionform">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="PU admission" />}
          </ListItem> */}

          {/* <ListItem button component={RouterLink} to="/applicationreviewpage">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Confirm admission" />}
          </ListItem> */}





        </AccordionDetails>
      </Accordion>
      )}

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>LMS</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/dashmmfaccourses">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="My courses" />}
          </ListItem>



          {/* <ListItem button component={RouterLink} to="/videopage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Video page" />}
</ListItem> */}

          <ListItem button component={RouterLink} to="/dashmlmsvideos">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AI Videos" />}
          </ListItem>

          {/* <ListItem button component={RouterLink} to="/dashmreactflow1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Mind map" />}
</ListItem> */}


          <ListItem button component={RouterLink} to="/dashmmindmaplist">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Mind map list" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmtimeslotsn1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Time slot" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmworkloadn1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Work load" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmfacwcal">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Faculty Workload Calendar" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmask1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AI NLP Knowledgebase questions" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/facultytopicpageds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Course Forum" />}
          </ListItem>


          {/* <ListItem button component={RouterLink} to="/dashmmindmapnodes">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Mind map nodes" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmmindmapedges">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Mind map edges" />}
</ListItem> */}


          {/* <ListItem button component={RouterLink} to="/dashmmcolevels">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Threshold Attainment levels" />}
</ListItem> */}
          {/* <ListItem button component={RouterLink} to="/dashmmfaccoursesatt">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="CO attainment" />}
</ListItem> */}
          {/* <ListItem button component={RouterLink} to="/dashmmattcalc">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="CO attainment" />}
</ListItem> */}

        </AccordionDetails>
      </Accordion>
      )}

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Patient Management</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashmPatient">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Patient details record" />}
          </ListItem>

        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Patient Admission</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashmpadmission">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Patient admission" />}
          </ListItem>



        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Bed Management</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashmicu">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="ICU" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmmicu">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="MICU" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnicu">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="NICU" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmhdu">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="HDU" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmward">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Ward" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmemergency">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Emergency" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnemergency">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Neo Emergency" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmicubed">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="ICU bed" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmmicubed">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="MICU bed" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnicubed">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="NIU bed" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmhdubed">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="HDU bed" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmwardbed">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Ward bed" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmerbed">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="ER bed" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnerbed">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="NER bed" />}
          </ListItem>


        </AccordionDetails>
      </Accordion>


      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>MRD Hospital</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashmpadmhistory">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="MRD History" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmpillness">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Past illness" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmpsurgery">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Surgery status" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmpfamily">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Family History" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmpallergies">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Allergy information" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmpconsent">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Consent form" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmptreatment">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Treatment plan" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmplab">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Lab reports" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmpimaging">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Imaging reports" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmpdischarge">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Discharge Summary" />}
          </ListItem>



        </AccordionDetails>
      </Accordion>


      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Hospital Billing</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashmpbilling">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Patient billing" />}
          </ListItem>


        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Waste Management</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashmwbin">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Waste bin" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmwcolschedule1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Collection schedule" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmwdisposal1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Waste disposal" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmwspill1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Waste spill" />}
          </ListItem>


          {/* <ListItem button component={RouterLink} to="/dashmwcollection">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Waste collection" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmwcolschedule">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Collection schedule" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmwdisposal">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Waste disposal" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmwspill">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Waste spill" />}
</ListItem> */}


        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Patient Counseling</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashmpcounselnew">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="New Patient Counseling" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmpcounselc">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Patient counselling" />}
          </ListItem>

        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Hospital food</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashmpmealplan">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Meal plan" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmpfood">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Patient meal" />}
          </ListItem>


        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Academics and Regulations</Typography>}
        </AccordionSummary>
        <AccordionDetails>

           <ListItem button component={RouterLink} to="/dashmunivampus">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Campus" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmunivfac">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Institution Schools and Faculties" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmunivdep">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Institution departments" />}
</ListItem>


          {/* <ListItem button component={RouterLink} to="/dashmmprograms">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Master Program List" />}
          </ListItem> */}
          {/* <ListItem button component={RouterLink} to="/regulationmaster">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Regulation" />}
          </ListItem> */}
          {/* <ListItem button component={RouterLink} to="/regulationsubjects">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Regulation Subjects" />}
          </ListItem> */}
          {/* <ListItem button component={RouterLink} to="/regulationseats">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Regulation Seat Matrix" />}
          </ListItem> */}
          <ListItem button component={RouterLink} to="/dashmmcourseslist">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Master course list offered" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmmstudents1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Master student list" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmmacadcal">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Academic calendar" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmlessonplannew">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Lesson Plan" />}
          </ListItem>

        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Salary and Attendance</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          {/* <ListItem button component={RouterLink} to="/dashboardj">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Salary and Attendance" />}
</ListItem> */}

          <ListItem button component={RouterLink} to="/ipaddressj">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="IP Address management" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/attendancej">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Attendance" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/allattendancej">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Attendance all" />}
          </ListItem>

          {/* <ListItem button component={RouterLink} to="/allattendancej">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Attendance all" />}
</ListItem> */}

          <ListItem button component={RouterLink} to="/salaryj">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Configure Salary" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/salarybysearchj">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Search Salary" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/deductionj">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Salary Deduction" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/salaryslipj">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Salary Slip" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/attendancebyemailj">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Search Attendance" />}
          </ListItem>

        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Class and Attendance</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/classes">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Attendance" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/classesn">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Attendance image" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmclassnew">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Class schedule" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmclassnewc">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Class by date" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmattpcode">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Attendance report programwise" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmattstud">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Attendance report studentwise" />}
          </ListItem>

          {/* <ListItem button component={RouterLink} to="/studentattendanceviewds">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Supplementary Attendance" />}
</ListItem>

<ListItem button component={RouterLink} to="/requestedattendanceds">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Supplementary Request" />}
</ListItem> */}

        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>SERB DST Proposal</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashmserbplan">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="SERB Timeline" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmserb">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="SERB text" />}
          </ListItem>



        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Feedback</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/feedbackmanagement">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Manage feedback" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/feedbackinternalmanagement">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Curriculum feedback" />}
          </ListItem>




        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>CO PO attainment</Typography>}
        </AccordionSummary>
        <AccordionDetails>


          <ListItem button component={RouterLink} to="/dashmmcoatt">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Direct Attainment" />}
          </ListItem>



          <ListItem button component={RouterLink} to="/feedbackinternalmanagement1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Indirect Attainment" />}
          </ListItem>




        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Breakout rooms</Typography>}
        </AccordionSummary>
        <AccordionDetails>


          <ListItem button component={RouterLink} to="/classes1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Breakout rooms" />}
          </ListItem>







        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Accreditation</Typography>}
        </AccordionSummary>
        <AccordionDetails>



          <ListItem button component={RouterLink} to="/dashmnn11">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="1.1 Outcome based curriculum" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn12">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="1.2 Stakeholder participation" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmmvac">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="1.3 Value added courses" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmnn14">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="1.4 Practical and Industry Focus" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn15">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="1.5 Practical and Skill Orientation" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn17">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="1.7 Curriculum revision" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn16">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="1.6 Online and Blended Learning" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmseminar">
            <ListItemIcon>
              <AutoModeIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="2.4.2 Seminars participated" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmbfacyear">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="2.4.3 Year wise faculty" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmnn211a">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="2.1 Recruitment committee" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn211b">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="2.1 Recruitment faculties" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn22">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="2.2 Pay and allowances" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn23">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="2.3 Faculty Diversity" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn244">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="2.4.4 Faculty participation in MOOC" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn25">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="2.5 Faculty Retention" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn26">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="2.6 Faculty Student Ratio" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn31">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="3.1 Physical Infrastructure" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn32">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="3.2 Library as learning resource" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmnn33a">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="3.3 IT Infrastructure" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn33b">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="3.3 and 3.4 Labs and Research Facilities" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn35">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="3.5 Divyangan Friendly Resources" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn36">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="3.6 Innovation Resources" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmbtrialb">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="4.1 4.2 4.3 4.4 4.5 Trial balance" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmnn46">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="4.6 Financial Risks and Controls" />}
          </ListItem>


          <ListItem button component={RouterLink} to="/dashmnn51">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="5.1 Teaching pedagogy" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn52">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="5.2 Internship and field projects" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn53examdays">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="5.3 Exam days" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn53passp">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="5.3 Pass percentage" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn53obe">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="5.3 OBE Implementation" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn54">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="5.4 Grievance Management" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn55">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="5.5 Catering to diversity" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn56">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="5.6 LMS" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmbmou">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="5.7 Industry Academia Linkage" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmnn61">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="6.1 Club activities and technical festivals" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn62">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="6.2 Hackathon" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn6clubs">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="6.3 6.3 6.5 6.6 Club activities" />}
          </ListItem>


          <ListItem button component={RouterLink} to="/dashmnn76">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="7.6 IQAC minutes" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn781">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="7.8 Inter University Collaboration" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn82">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="8.2 Academic Progression" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn83">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="8.3 Self Employment and Entrepreneurship" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn84">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="8.4 Competitive Exams" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmstudawardsnew">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="8.5 Student awards" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn86">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="8.6 Enrollment Percentage" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn87">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="8.7 Graduation" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmprojects">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="9.1 Research Grant Projects" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmpublications">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="9.2 Publications" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmpatents">
            <ListItemIcon>
              <AcUnitIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="9.3 Research Quality Patents" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmconsultancy">
            <ListItemIcon>
              <AddTaskIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="9.3 Research Quality Consultancy" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmphdguide">
            <ListItemIcon>
              <AdjustIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="9.4 PhD Awarded" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmteacherfellow">
            <ListItemIcon>
              <AccountBalanceWalletIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="9.5 Fellowship and awards" style={{ overflow: 'scroll' }} />}
          </ListItem>


          <ListItem button component={RouterLink} to="/dashmnn96">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="9.6 IPR Produced" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn97">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="9.7 Research Collaboration" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmnn98">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="9.8 Student Startup" />}
          </ListItem>
















          <ListItem button component={RouterLink} to="/dashmscholnew">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Scholarships" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmeventsnew1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Events list 10.1 2.4.1 and others" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmpolicy">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Generate policies" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmqualitative">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Qualitative" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmhtmleditor">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="HTML template creator" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmgeotagtest">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Check geotag" />}
          </ListItem>



          <ListItem button component={RouterLink} to="/dashmmplacement">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Placement" />}
          </ListItem>







          {/* <ListItem button component={RouterLink} to="/campuswebsite">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Campus" />}
</ListItem> */}






        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Other reports</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashalerts">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Deficiency Personal data" />}
          </ListItem>


          <ListItem button component={RouterLink} to="/report2">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Project report" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/eventreport">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Event report" />}
          </ListItem>


        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Recruitment</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/internal/jobmanager">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Recruitment manager" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/recruitment-management">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px", whiteSpace: "normal" }} primary="Recruitment module" />}
          </ListItem>



        </AccordionDetails>
      </Accordion>

      <Accordion>


        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Transport</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/route">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Routes and buses" />}
          </ListItem>

        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Placement</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashmjobds">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="All jobs" />}
          </ListItem>
          {/* <ListItem button component={RouterLink} to="/dashmjobapplicationds">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Application Status" />}
</ListItem> */}

          <ListItem button component={RouterLink} to="/dashpsectorreport">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Sector wise report" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashpappplaced">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Program wise placement" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmplaced">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Year wise placement" />}
          </ListItem>


        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Event registration</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashmeventsnew1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="All events" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dasheventlistpage">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Manage registration" />}
          </ListItem>

          {/* <ListItem button component={RouterLink} to="/eventslist">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Event registration" />}
</ListItem>  */}

          <ListItem button component={RouterLink} to={`/eventlistwithcolid/${global1.colid}`}>
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Website registration link" />}
          </ListItem>

        </AccordionDetails>
      </Accordion>



      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Forms</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/forms">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Forms" />}
          </ListItem>

        </AccordionDetails>
      </Accordion>

       <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>HR and Salary</Typography>}
        </AccordionSummary>
        <AccordionDetails>

           <ListItem button component={RouterLink} to="/dashmhrstructure">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Salary structure" />}
</ListItem>
 <ListItem button component={RouterLink} to="/ugcseventhpaystructure">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="UGC seventh pay structure" />}
</ListItem>
 {/* <ListItem button component={RouterLink} to="/dashmhrstructuresal">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Salary components" />}
</ListItem> */}
 <ListItem button component={RouterLink} to="/dashmhrsalstructure">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Employee salary structure" />}
</ListItem>

 <ListItem button component={RouterLink} to="/dashmhrsalary">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Employee salary" />}
</ListItem>
{/* <ListItem button component={RouterLink} to="/salassign">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Employee Salary generator" />}
</ListItem> */}
<ListItem button component={RouterLink} to="/salassign1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Employee Salary generator 2" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmhrempledger">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Employee ledger" />}
</ListItem>
{/* <ListItem button component={RouterLink} to="/salarypivot">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Monthwise salary sheet" />}
</ListItem> */}
<ListItem button component={RouterLink} to="/salarypivot1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Monthwise salary sheet drill down" />}
</ListItem>
<ListItem button component={RouterLink} to="/hrsalarycomponentreport">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Salary component report" />}
</ListItem>
<ListItem button component={RouterLink} to="/hrsalaryslip">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Salary slip" />}
</ListItem>
<ListItem button component={RouterLink} to="/mysalaryslip">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="My salary slip" />}
</ListItem>
<ListItem button component={RouterLink} to="/visitingfaculty">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Visiting faculty" />}
</ListItem>
<ListItem button component={RouterLink} to="/visitingfacultyregister">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Visiting faculty register" />}
</ListItem>
<ListItem button component={RouterLink} to="/visitingfacultypay">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Visiting faculty pay" />}
</ListItem>
<ListItem button component={RouterLink} to="/saldeduction">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Salary deduction TDS" />}
</ListItem>
<ListItem button component={RouterLink} to="/saldeductiontdspf">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Salary deduction TDS and PF" />}
</ListItem>
<ListItem button component={RouterLink} to="/salarytransfer">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Populate salary" />}
</ListItem>
<ListItem button component={RouterLink} to="/populatearrear">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Populate arrear" />}
</ListItem>
<ListItem button component={RouterLink} to="/hrresignation">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Resignation" />}
</ListItem>
<ListItem button component={RouterLink} to="/hrresignationreport">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Resignation report" />}
</ListItem>



        </AccordionDetails>
        </Accordion>

      {/* <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>HRMS</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/setuppageds1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Leave Setup" />}
          </ListItem>


          <ListItem button component={RouterLink} to="/leavespageds1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Apply or Approve" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/ip-management">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="IP Management" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/attendance-settings">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Attendance Settings" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/salary-management">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Salary management" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/salary-slips">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Salary slip" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/admin-attendance">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Admin Attendance" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/attendance-dashboard">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Attendance Dashboard" />}
          </ListItem>



        </AccordionDetails>
      </Accordion> */}

      {false && (
      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Leave old</Typography>}
        </AccordionSummary>
        <AccordionDetails>



          <ListItem button component={RouterLink} to="/dashleavesetup">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Leave Setup" />}
          </ListItem>

          {/* <ListItem button component={RouterLink} to="/setuppage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Setup" />}
</ListItem> */}

          <ListItem button component={RouterLink} to="/leavespage">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Apply or Approve" />}
          </ListItem>

          {/* <ListItem button component={RouterLink} to="/navigatetopage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Navigate" />}
</ListItem> */}

        </AccordionDetails>
      </Accordion>
      )}

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>NIRF Data</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashmstudgender">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student by gender" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmstudcategory">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student by category" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmstudquota">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student by quota" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashnirfplacement">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Placement report" />}
          </ListItem>


          <ListItem button component={RouterLink} to="/dashmstudlist">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student count" />}
          </ListItem>

        </AccordionDetails>
      </Accordion>


      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Other Accreditation</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashmnallaccr">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Accreditation framework" />}
          </ListItem>

        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>MRN PR and PO</Typography>}
        </AccordionSummary>
        <AccordionDetails>

           <ListItem button component={RouterLink} to="/dashmprtemplate">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Templates" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmprtemplateapprovers">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Approvers" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmprlist">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="MRN List" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmpritems">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="MRN Items" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmitemlist">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Item list" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmcategorybudget">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Category Budget" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmpraudit">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="PR Audit log" />}
</ListItem>
<ListItem button component={RouterLink} to="/mrncreate">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="MRN create" />}
</ListItem>
<ListItem button component={RouterLink} to="/prapproverscreen">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="MRN approve" />}
</ListItem>
<ListItem button component={RouterLink} to="/mrnapprover1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="MRN approve 1" />}
</ListItem>



        </AccordionDetails>
        </Accordion>

         <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{fontSize: 14}}>Purchase and Store</Typography>}
        </AccordionSummary>
        <AccordionDetails>

        <ListItem button component={RouterLink} to="/storepage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Store" />}
</ListItem>

{/* <ListItem button component={RouterLink} to="/categorypage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Category" />}
</ListItem> */}

<ListItem button component={RouterLink} to="/stockpage1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Stock" />}
</ListItem>

{/* <ListItem button component={RouterLink} to="/budgetpage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Budget" />}
</ListItem> */}

{/* <ListItem button component={RouterLink} to="/indbudgetapprovalroles">
<ListItemIcon>
<SettingsIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Budget Approval Roles" />}
</ListItem> */}

{/* <ListItem button component={RouterLink} to="/indentpage1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Indent" />}
</ListItem> */}

<ListItem button component={RouterLink} to="/indentpage2">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Indent new" />}
</ListItem>

<ListItem button component={RouterLink} to="/indindentapprovalroles">
<ListItemIcon>
<SettingsIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Indent Approval Roles" />}
</ListItem>

{/* <ListItem button component={RouterLink} to="/indentapproval">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Indent Approval" />}
</ListItem> */}

{/* <ListItem button component={RouterLink} to="/indentapproval1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Indent Approval" />}
</ListItem> */}

<ListItem button component={RouterLink} to="/indentapproval2">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Indent Approval" />}
</ListItem>

<ListItem button component={RouterLink} to="/indentbyuser">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Indent by user" />}
</ListItem>


{/* <ListItem button component={RouterLink} to="/rfppage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="RFP" />}
</ListItem> */}


{/* <ListItem button component={RouterLink} to="/rfpfromindent">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="RFP from indent" />}
</ListItem> */}

{/* <ListItem button component={RouterLink} to="/rfpfromindentpage1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="RFP from indent new" />}
</ListItem> */}

<ListItem button component={RouterLink} to="/rfpfromindentpage4">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="RFP from indent detailed" />}
</ListItem>

{/* <ListItem button component={RouterLink} to="/rfpviewpage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="RFP list" />}
</ListItem> */}

<ListItem button component={RouterLink} to="/rfpprintview">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="RFP Print View" />}
</ListItem>

<ListItem button component={RouterLink} to="/vendormappage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="RFP Vendor Map" />}
</ListItem>

<ListItem button component={RouterLink} to="/vendorcomparisonpagecol3">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Vendor comparison columnwise" />}
</ListItem>

<ListItem button component={RouterLink} to="/itemwisepoperpage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="PO Creation" />}
</ListItem>

<ListItem button component={RouterLink} to="/poprintpage2">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="PO Print Preview" />}
</ListItem>


{/* <ListItem button component={RouterLink} to="/vendorpage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Vendor submission" />}
</ListItem> */}

{/* <ListItem button component={RouterLink} to="/vendorcomparisonpage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Vendor comparison" />}
</ListItem> */}

{/* <ListItem button component={RouterLink} to="/vendornegotiation1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Vendor negotiation" />}
</ListItem> */}

{/* <ListItem button component={RouterLink} to="/vendorfinalprice">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Vendor final price" />}
</ListItem> */}

{/* <ListItem button component={RouterLink} to="/vendorfinalcomparison1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Vendor final comparison" />}
</ListItem> */}

<ListItem button component={RouterLink} to="/categoryofficerpage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Category officer" />}
</ListItem>

{/* <ListItem button component={RouterLink} to="/createpopage1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Create PO" />}
</ListItem> */}

{/* <ListItem button component={RouterLink} to="/poapprovalpage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Approve PO" />}
</ListItem> */}

<ListItem button component={RouterLink} to="/poapprovalroles">
<ListItemIcon>
<SettingsIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="PO Approval Roles" />}
</ListItem>

<ListItem button component={RouterLink} to="/poapprovalpage1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Approve PO" />}
</ListItem>


{/* <ListItem button component={RouterLink} to="/deliveryschedulepage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Delivery schedule" />}
</ListItem> */}

<ListItem button component={RouterLink} to="/po-shipment-batches">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="PO Shipment Batches" />}
</ListItem>

<ListItem button component={RouterLink} to="/po-security-receive">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Security PO Receive" />}
</ListItem>

<ListItem button component={RouterLink} to="/po-received-inspection">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="PO Received Inspection" />}
</ListItem>

{/* <ListItem button component={RouterLink} to="/qualitypage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Quality" />}
</ListItem> */}

{/* <ListItem button component={RouterLink} to="/grnpage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="GRN Page" />}
</ListItem> */}

{/* <ListItem button component={RouterLink} to="/grnviewpage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="GRN View Page" />}
</ListItem> */}

{/* <ListItem button component={RouterLink} to="/poreceivedsummary">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="PO Received Summary" />}
</ListItem> */}

{/* <ListItem button component={RouterLink} to="/inwardgatepass">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Inward Gate Pass" />}
</ListItem> */}

<ListItem button component={RouterLink} to="/invoicecreatepage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Invoice create" />}
</ListItem>

<ListItem button component={RouterLink} to="/invoicepaymentpage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Invoice payment" />}
</ListItem>

<ListItem button component={RouterLink} to="/financedashboard">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Finance dashboard" />}
</ListItem>

{/* <ListItem button component={RouterLink} to="/prepdashboard">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Budget analysis" />}
</ListItem> */}

<ListItem button component={RouterLink} to="/financedashboardnew">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Finance heatmap" />}
</ListItem>

<ListItem button component={RouterLink} to="/agingdashboardpage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Aging Dashboard" />}
</ListItem>

<ListItem button component={RouterLink} to="/vendorledgerpage1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Vendor ledger" />}
</ListItem>

<ListItem button component={RouterLink} to="/overduepage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Overdue page" />}
</ListItem>

<ListItem button component={RouterLink} to="/vendordashboardpage">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Vendor Finance Page" />}
</ListItem>

<ListItem button component={RouterLink} to="/vendorcreatepage1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Vendor create" />}
</ListItem>

<ListItem button component={RouterLink} to="/vendor-login">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Vendor login" />}
</ListItem>

{/* <ListItem button component={RouterLink} to="/vendorcomparisonpagecol">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Vendor comparison columnwise" />}
</ListItem> */}

{/* <ListItem button component={RouterLink} to="/vendorcomparisonpagecol2">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Vendor comparison columnwise" />}
</ListItem> */}

{/* <ListItem button component={RouterLink} to="/poprintpage1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="PO Print Preview" />}
</ListItem> */}

          </AccordionDetails>
          </Accordion>


      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Assets and Purchase</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashmmassets">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Asset register" />}
          </ListItem>
          {/* <ListItem button component={RouterLink} to="/dashmmassetassign">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Asset assignment" />}
</ListItem> */}
          <ListItem button component={RouterLink} to="/dashmmvendors">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Vendor list" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmmpurchase">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Purchase order" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmmpurchaseitems">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="PO items" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmmpopayments">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="PO payments" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmmvendorbanks">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Vendor bank details" />}
          </ListItem>



        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Groups</Typography>}
        </AccordionSummary>
        <AccordionDetails>


          <ListItem button component={RouterLink} to="/dashmngroup">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="My Groups" />}
          </ListItem>

        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Settings</Typography>}
        </AccordionSummary>
        <AccordionDetails>



          <ListItem button component={RouterLink} to="/dashmquotanew">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AI Credits" />}
          </ListItem>

           <ListItem button component={RouterLink} to="/insdetails">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Institution details" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashawsconfig">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AWS config" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/awsconfigcrudpage">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AWS Configuration CRUD" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/awsfilelibrary">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AWS File Library" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/awsdocuments">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AWS Documents" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/emailconfiguration">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Email Configuration" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/aiconfiguration">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AI Configuration" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmpassword">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Change password" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/signinpay">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Subscription" />}
          </ListItem>



        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Test and Internship</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashmmtestnewm">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Test list" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmminewm">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Internship" />}
          </ListItem>

          {/* <ListItem button component={RouterLink} to="/Dashtest1">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Internship" />}
</ListItem> */}

          {/* <ListItem button component={RouterLink} to="/dashmmtestsessions">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Test sessions" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmmtestseenrol">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Test enroll" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmmtestsections">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Test sections" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmmtestqnew">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Test questions" />}
</ListItem> */}





        </AccordionDetails>
      </Accordion>


      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Journal</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashmlpublications">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Publications" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmlpublicationspublic">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Public Publications" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmlpubeditions">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Publication editions" />}
          </ListItem>
          {/* <ListItem button component={RouterLink} to="/dashmlpubreviews">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Review comments" />}
</ListItem> */}
          <ListItem button component={RouterLink} to="/dashmlpubarticles">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Submit article" />}
          </ListItem>


        </AccordionDetails>
      </Accordion>


      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Solved papers</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashmmguides">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Solved questions" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmmctalentreg">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Talent exam registration" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/dashmonlinepay">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Online payment" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/viewmallclients">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Registration details" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/viewmusers">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student details" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashmmstudentprofile">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Student profile" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/viewminterns">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Active internship" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dashinterncomplete">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Completed internship" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/viewmpricing">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Pricing calculator" />}
          </ListItem>

          {/* <ListItem button component={RouterLink} to="/dashmmtestqnewcs">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Question with image" />}
</ListItem> */}



        </AccordionDetails>
      </Accordion>


      {false && (
      <Accordion>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <SettingsIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Website</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/dashmwebcourses">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Courses for Website" />}
</ListItem>
 <ListItem button component={RouterLink} to="/dashmwebevents">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Events for website" />}
</ListItem>

          </AccordionDetails>
          </Accordion>
          )}

           <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Games</Typography>}
        </AccordionSummary>
        <AccordionDetails>

           <ListItem button component={RouterLink} to="/gametoys">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Toys game" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/gametoys1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Toys game" />}
          </ListItem>

        </AccordionDetails>
        </Accordion>





      <Accordion>
        <AccordionSummary aria-controls="panel1-content" id="panel1-header">
          <AccountCircleIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Virtual lab</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          {/* <ListItem button component={RouterLink} to="/resistor">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Resistor" />}
</ListItem>
<ListItem button component={RouterLink} to="/bubblesort">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Bubblesort" />}
</ListItem>

<ListItem button component={RouterLink} to="/firstsimulator">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Logic Gate Simulator 1" />}
</ListItem>

<ListItem button component={RouterLink} to="/secondsimulator">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Logic Gate Simulator 2" />}
</ListItem> */}


          <ListItem button component={RouterLink} to="/codeeditor">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Code editor" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/subhalfadder1">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Half adder 1" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/basiclogicgateexpfirst">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Logic gate 1" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/basiclogicgateexpsecond">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Logic gate 2" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/halfsubtractor">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Half Subtractor" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/fullsubtractor">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Full Subtractor" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/twobitadder">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Two bit adder" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/fourbitaddersubtractor">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Four bit adder subtractor" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/codl">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Characterization of digital logic" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/insertionsort">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Insertion sort" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/selectionsort">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Selection sort" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/arrayvisualization">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Array visualization" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/stackvisualization">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Stack visualization" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/binaryarith">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Binary arithmetic" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/queuevisual">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Queue visualization" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/binarysearch">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Binary search" />}
          </ListItem>


          <ListItem button component={RouterLink} to="/binaryarithmetics">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Binary arithmetic 2" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/notgate">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="NOT gate 1" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/notgate2">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="NOT gate 2" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/andgate">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AND gate" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/andgate2">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AND gate 2" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/orgate">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="OR gate" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/orgate2">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="OR gate 2" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/nandgate">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="NAND gate" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/nandgate2">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="NAND gate 2" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/norgate">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="NOR gate" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/norgate2">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="NOR gate 2" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/xorgate">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="XOR gate" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/halfsubtractorcircuit">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Half subtractor circuit" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/xnorgate">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="XNOR gate" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/xnorgate2">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="XNOR gate 2" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/xorgate2">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="XOR gate 2" />}
          </ListItem>


          <ListItem button component={RouterLink} to="/fullsubtractorcircuit">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Full subtractor circuit" />}
          </ListItem>

          {/* <ListItem button component={RouterLink} to="/fullsubcircuitverify">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Full subtractor circuit verify" />}
</ListItem> */}

          <ListItem button component={RouterLink} to="/halfsubcircuitverify">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Half subtractor circuit" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/bcdtoexcessconverter">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="BCD to excess converter" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/bitserial">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Bit serial" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/graytobinaryconverter">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Gray to binary converter" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/stephanslaw">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Stephans law" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/opticalfibre">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Optical fibre" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/transformeroilstrength">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Transformer oil strength" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/phasesequence">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Phase sequence" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/digitaltriradii">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Digital tritadii in anthropology" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/fingerprintpatterns">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Finger print patterns" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/dcshuntmotor">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="DC Shunt motor simulation" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/skeletonexp">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Skeleton experiment 1" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/titration">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Titration" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/skeletonpart2">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Skeleton experiment 2" />}
          </ListItem>


          <ListItem button component={RouterLink} to="/infraredspectros">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Infra red spectroscopy with Salt Plates" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/electricalmachinelab">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Electrical Machine Lab" />}
          </ListItem>


        </AccordionDetails>
      </Accordion>


      <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography sx={{ fontSize: 14 }}>Virtual Lab Games</Typography>}
        </AccordionSummary>
        <AccordionDetails>

          <ListItem button component={RouterLink} to="/infraredspectros">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Infra red spectroscopy with Salt Plates" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/skeletonpart2game">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Skeleton Games 2" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/getmoldgame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Get Mold" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/opticalfibregame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Optical Fibre Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/digitaltriradiigame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Digital Triradii Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/transformeroilgame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Transformer Oil Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/titrationgame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Titration Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/infraredgame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Infra Red Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/bcdtoexcessgames">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="BCD to Excess Converter Game" />}
          </ListItem>


          <ListItem button component={RouterLink} to="/halfsubcircuitverifygame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Half sub circuit Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/fullsubcircuitverifygame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Full sub circuit verify Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/fullsubtractorcircuitgame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Full subtractor circuit Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/graytobinaryconvertedgame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Gray to Binary Converter Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/halfsubtractorcircuitgame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Half subtractor circuit Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/andgategame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="AND GATE Game" />}
          </ListItem>


          <ListItem button component={RouterLink} to="/bitserialgame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Bit Serial Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/fingerprintpatterngames">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Finger Print Pattern Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/nandgategame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="NAND Gate Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/norgategame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="NOR Gate Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/notgategame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="NOT Gate Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/orgategame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="OR Gate Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/skeletonexpgame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Skeleton exp Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/stefanslawgame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Stefan's law Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/subhalfadder1game">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Sub half adder Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/xnorgategame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="XNOR gate Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/xorgategame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="XOR gate Game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/finddiff">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Difference game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/pacmangame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Pac man" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/racegame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Race game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/wordguessing">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Word guessing" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/imgpuzzle">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Image puzzle" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/betteraimgame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Better aim" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/tetrisgame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Tetris game" />}
          </ListItem>

          {/* <ListItem button component={RouterLink} to="/dicegame">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Dice game" />}
</ListItem> */}

          <ListItem button component={RouterLink} to="/sudokugame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Sudoku game" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/towerofhanoi">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Tower of Hanoi" />}
          </ListItem>

          <ListItem button component={RouterLink} to="/ultimatebattlegame">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primaryTypographyProps={{ fontSize: "14px" }} primary="Ultimate battle game" />}
          </ListItem>

          {/* <ListItem button component={RouterLink} to="/mazegen">
<ListItemIcon>
<PersonIcon />
</ListItemIcon>
{open && <ListItemText primaryTypographyProps={{fontSize: "14px"}} primary="Maze game" />}
</ListItem> */}







        </AccordionDetails>
      </Accordion>


      {/* <Accordion>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <BusinessIcon sx={{ marginRight: 1 }} />
          {open && <Typography>Campus Management</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/departments">
            <ListItemIcon>
              <BusinessIcon />
            </ListItemIcon>
            {open && <ListItemText primary="Departments" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/courses">
            <ListItemIcon>
              <LocalOfferIcon />
            </ListItemIcon>
            {open && <ListItemText primary="Courses" />}
          </ListItem>
        </AccordionDetails>
      </Accordion> */}

      {/* <Accordion>
        <AccordionSummary aria-controls="panel4-content" id="panel4-header">
          <HostelIcon sx={{ marginRight: 1 }} />
          {open && <Typography>Hostel Management</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <ListItem button component={RouterLink} to="/hostel-room">
            <ListItemIcon>
              <HostelIcon />
            </ListItemIcon>
            {open && <ListItemText primary="Hostel Room" />}
          </ListItem>
          <ListItem button component={RouterLink} to="/hostel-room-types">
            <ListItemIcon>
              <HostelIcon />
            </ListItemIcon>
            {open && <ListItemText primary="Hostel Room Types" />}
          </ListItem>
        </AccordionDetails>
      </Accordion> */}
    </div>
  );
}

export function secondaryListItems({ open }) {
  return (
    <div>
      <ListSubheader inset>Saved reports</ListSubheader>
      <ListItem button>
        <ListItemIcon>
          <AssignmentIcon />
        </ListItemIcon>
        {open && <ListItemText primary="Current month" />}
      </ListItem>
      <ListItem button>
        <ListItemIcon>
          <AssignmentIcon />
        </ListItemIcon>
        {open && <ListItemText primary="Last quarter" />}
      </ListItem>
      <ListItem button>
        <ListItemIcon>
          <AssignmentIcon />
        </ListItemIcon>
        {open && <ListItemText primary="Year-end sale" />}
      </ListItem>
    </div>
  );
}
