import ForgeUI, {
    IssuePanel, Fragment, render,
    Text, useState
} from "@forge/ui";
import {addComment, getIssue, getIssueDetails, getIssues, slackRequest, updateSLA} from "./helpers";
import {sla,getParticularMessage} from "./calculation";
import {ESCALATION_TWO, FIRST_NOTIFICATION, ISSUE_CREATED_NOTIFICATION, STORAGE_KEY_PREFIX} from "./constants";
import {storage} from "@forge/api";
const App = (issueId) => {

    return (
        <Fragment>
            <Text content={issueId}/>
        </Fragment>
    );
};

export const run = render(
    <IssuePanel>
        <App />
    </IssuePanel>
);

const updateIssueId = async function(issueId) {
    return issueId
}

export async function trigger(event,context){

    console.log("Event Triggered")
    const rest = await getIssue(event.issue.id)
    const slaValue = await sla(event.issue.fields.created,rest.fields.priority.name,rest.fields.project.key)
    console.log(`Calculated SLA is: ${slaValue}`)

    await updateSLA(event.issue.id,slaValue)
    await addComment(event.issue.id,ISSUE_CREATED_NOTIFICATION,rest.fields.project.key)


}

export async function scheduledTrigger(event){

    console.log("Web Event Triggered")
    const rest = await getIssues()
    const issuesList = rest.issues

   issuesList.map(async(issue) => {
       console.log(issue.id + "  , "+issue.fields.priority.name + " , "+ issue.fields.created + " , " + issue.fields.customfield_10048)
       const comment =  await getParticularMessage(issue.fields.created,issue.fields.priority.name,issue.fields.project.key,issue.fields.customfield_10048)
       console.log("Comment message is: "+comment)
       await addComment(issue.id,comment,issue.fields.project.key)

   })

}