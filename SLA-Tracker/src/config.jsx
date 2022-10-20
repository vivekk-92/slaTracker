import ForgeUI, {
    render,
    AdminPage,
    Fragment,
    Form,
    Select,
    Option,
    useState,
    SectionMessage,
    Table,
    Head,
    Cell,
    Row,
    TextField,
    Text,
    UserPicker,
    useEffect,
    Strong,
    User,
    Button
} from '@forge/ui';
import {TIME_OPTIONS, STORAGE_KEY_PREFIX, Week_DAYS, ISSUE_SEVERITY} from './constants';


import { storage } from '@forge/api';
import {getIssueDetails, getIssues, getProjects, writeFileSync, writeToFile} from "./helpers";


const App = () => {
    const [projectConfigState, setProjectConfigState] = useState(undefined);
    const [isProjectConfigSubmitted, setProjectConfigSubmitted] = useState(false);
    const [projectKey, setProjectKey] = useState(undefined);
    const [projectData] = useState(() => getProjects());
    const [isProjectAlreadyConfigured, setProjectAlreadyConfigured] = useState(undefined )
    const [configureButtonClicked, setConfigureButtonClicked] = useState(false)
    const [configTableNotSeen, setConfigTableNotSeen] = useState(true)
    const [endTime, setEndTime] = useState( "")
    const [workingDays, setWorkingDays] = useState( "")
    const [startTime, setStartTime] = useState( "")
    const [criticalSla, setCriticalSla] = useState( "")
    const [criticalEscalationSla, setCriticalEscalationSla] = useState( "")
    const [highSla, setHighSla] = useState( "")
    const [highEscalationSla, setHighEscalationSla] = useState( "")
    const [mediumSla, setMediumSla] = useState( "")
    const [mediumEscalationSla, setMediumEscalationSla] = useState( "")
    const [lowSla, setLowSla] = useState( "")
    const [lowEscalationSla, setLowMediumSla] = useState( "")
    const [escalation1 , setEscalation1 ] = useState("")
    const [escalation2 , setEscalation2 ] = useState("")
    const test = ['1','2','3']
    const test1 = test.reduce((accumulator,currentValue) =>{ return accumulator + currentValue + " ,"})
    useEffect(async () => {
        const storageData = await storage.get(`${STORAGE_KEY_PREFIX}_${projectKey}`);
        setProjectConfigState(storageData );
    }, [projectKey]);

    const onProjectPicked =async ({ project }) => {
        debugger
        setProjectKey(project);
        const storageData = await storage.get(`${STORAGE_KEY_PREFIX}_${project}`);
        if(storageData !== undefined) {
            setProjectAlreadyConfigured(true)
            setProjectConfigState(storageData);
            setStartTime(storageData['startTime'])
            setEndTime(storageData['endTime'])
            setWorkingDays(storageData['WorkingDays'].reduce((accumulator,currentValue)=>{ return " " + accumulator  + ", " +currentValue }))
            setCriticalSla(storageData['Critical'])
            setCriticalEscalationSla(storageData['Critical_escalationSla'])
            setHighSla(storageData['High'])
            setHighEscalationSla(storageData['High_escalationSla'])
            setMediumSla(storageData['Medium'])
            setMediumEscalationSla(storageData['Medium_escalationSla'])
            setLowSla(storageData['Low'])
            setLowMediumSla(storageData['Low_escalationSla'])
            setEscalation1(storageData['escalationLevel1'])
            setEscalation2(storageData['escalationLevel2'])
        } else {
            setProjectAlreadyConfigured(false)
        }
    }


    const onProjectConfigSubmit = async (projectConfig) => {
        await storage.set(`${STORAGE_KEY_PREFIX}_${projectKey}`, projectConfig);
        setProjectConfigState(projectConfig);
        setProjectConfigSubmitted(true);
        setProjectAlreadyConfigured(true)
        setConfigTableNotSeen(false)
        setStartTime(projectConfig['startTime'])
        setEndTime(projectConfig['endTime'])
        setWorkingDays(projectConfig['WorkingDays'].reduce((accumulator,currentValue)=>{ return " " + accumulator  + ", " +currentValue }))
        setCriticalSla(projectConfig['Critical'])
        setCriticalEscalationSla(projectConfig['Critical_escalationSla'])
        setHighSla(projectConfig['High'])
        setHighEscalationSla(projectConfig['High_escalationSla'])
        setMediumSla(projectConfig['Medium'])
        setMediumEscalationSla(projectConfig['Medium_escalationSla'])
        setLowSla(projectConfig['Low'])
        setLowMediumSla(projectConfig['Low_escalationSla'])
        setEscalation1(projectConfig['escalationLevel1'])
        setEscalation2(projectConfig['escalationLevel2'])
    };

    const renderProjectPicker = () => {
        return projectData.length !== 0
            ? <Fragment>
                <Text>In this page you can modify <Strong>SLA</Strong> configuration for selected project</Text>
                <Form onSubmit={onProjectPicked} submitButtonText="Choose">
                    <Select label="Choose project" name="project" isRequired={true} >
                        {projectData.map(project => <Option label={project.name} value={project.key} />)}
                    </Select>
                </Form>
            </Fragment>
            : <Text content="No configurable projects available" />
    }

    const renderWorkingHours = (shiftLabel, shiftName) => (
        <Select label= {shiftLabel} name={shiftName} isRequired={true}>
            {Object.values(TIME_OPTIONS).map(option => <Option label={option} value={option} />)}
        </Select>
    )

    const renderWorkingDays = () => (
        <Select label= "Choose Working Days of a week" name="WorkingDays" isMulti={true} isRequired={true}>
            {Object.values(Week_DAYS).map(option => <Option label={option} value={option} />)}
        </Select>
    )

    const renderSLAMapping = () => (
        <Table>
            <Head>
                <Cell>
                    <Text>Please provide SLA mapping for the issues</Text>
                </Cell>
                <Cell>
                    <SectionMessage title="SLA Configuration help" appearance="info">
                        <Text>Please set the sla following below standards:</Text>
                         <Text>   1 hour = 1h 1 day = 1d 1 week = 1w</Text>
                        <Text><Strong>For eg:</Strong> If you want to set SLA as 1 week please provide value as 1w</Text>
                    </SectionMessage>
                </Cell>
                <Cell>
                    <SectionMessage title="Escalation SLA info" appearance="info" >
                        <Text>Please provide value when you want second level escalation to be triggered</Text>
                        <Text><Strong>For eg:</Strong> If you want 2nd level escalation of Critical bug after 2 hours of SLA breach please set value as 2h</Text>
                    </SectionMessage>
                </Cell>
            </Head>
            <Row>
                <Cell>
                    <Text>Issue Severity</Text>
                </Cell>
                <Cell>
                    <Text >SLA</Text>
                </Cell>
                <Cell>
                    <Text>
                        Escalation SLA
                    </Text>
                </Cell>
            </Row>
            {Object.values(ISSUE_SEVERITY).map(issue => (
                <Row>
                    <Cell>
                        <Text>{issue}</Text>
                    </Cell>
                    <Cell>
                        <TextField isRequired={true} label="" name={issue} />
                    </Cell>
                    <Cell>
                        <TextField isRequired={true} label="" name={issue.concat("_escalationSla")} />
                    </Cell>
                </Row>
            ))}
        </Table>
    )

    const renderWorkingHoursAndDays = () => (
        <Table>
            <Head>
                <Cell>
                    <Text>Please Choose Working Hours and Days for your team</Text>
                </Cell>
            </Head>
                <Row>
                    <Cell>
                        {renderWorkingHours("Choose Working Hours Start Time","startTime")}
                    </Cell>
                    <Cell>
                        {renderWorkingHours("Choose Working Hours End Time","endTime")}
                    </Cell>
                    <Cell>
                        {renderWorkingDays()}
                    </Cell>
                </Row>

        </Table>
    )

    const renderEscalationMatrix = () => (
        <Table>
            <Head>
                <Cell>
                    <Text>Please select Escalation Levels</Text>
                </Cell>
            </Head>
                <Row>
                    <Cell>
                        <UserPicker isRequired={true} label="Escalation Level 1" name="escalationLevel1" />
                    </Cell>
                </Row>
            <Row>
                <Cell>
                    <UserPicker isRequired={true} label="Escalation Level 2" name="escalationLevel2" />
                </Cell>
            </Row>
        </Table>
    )

    const renderConfigTable =  () => {
        return(
        <Fragment>
            <Table>
                <Head>
                    <Cell><Text>Config for the project</Text></Cell>
                    <Cell></Cell>
                    <Cell></Cell>
                    <Cell></Cell>
                    <Cell></Cell>
                    <Cell></Cell>
                    <Cell><Button
                            text="Configure SLA"
                            onClick={() => {
                                setConfigTableNotSeen(false);
                                setConfigureButtonClicked(true);
                            }}
                        />
                    </Cell>
                </Head>
            </Table>
            <Table>
                <Head>
                    <Cell>
                        <Text>
                            <Strong>Working Hours</Strong>
                        </Text>
                    </Cell>
                    <Cell>
                        <Text>
                            <Strong>SLA of Critical Issue</Strong>
                        </Text>
                    </Cell>
                    <Cell>
                        <Text>
                            <Strong>SLA of High Issue</Strong>
                        </Text>
                    </Cell>
                    <Cell>
                        <Text>
                            <Strong>SLA of Medium Issue</Strong>
                        </Text>
                    </Cell>
                    <Cell>
                        <Text>
                            <Strong>SLA of Low Issue</Strong>
                        </Text>
                    </Cell>
                    <Cell>
                        <Text>
                            <Strong>First Escalation</Strong>
                        </Text>
                    </Cell>
                    <Cell>
                        <Text>
                            <Strong>Second Escalation</Strong>
                        </Text>
                    </Cell>
            </Head>
                    <Row>
                        <Cell><Text>{startTime + " - " + endTime} </Text></Cell>

                        <Cell><Text>{criticalSla}</Text></Cell>
                        <Cell><Text>{highSla}</Text></Cell>
                        <Cell><Text>{mediumSla}</Text></Cell>
                        <Cell><Text>{lowSla}</Text></Cell>
                        <Cell><Text><User accountId={escalation1}/></Text></Cell>
                        <Cell><Text><User accountId={escalation2}/></Text></Cell>
                    </Row>
            </Table>
            <Text>
                <Strong> Working Days:</Strong>{workingDays}
            </Text>
        </Fragment>
        )
    }

    const renderConfigTableAfterSlaSubmit =  () => {
        return(
            <Fragment>
                <Table>
                    <Head>
                        <Cell>
                            <Text>Saved Config is: </Text>
                        </Cell>
                    </Head>
                </Table>
                <Table>
                    <Head>
                        <Cell>
                            <Text>
                                <Strong>Working Hours</Strong>
                            </Text>
                        </Cell>
                        <Cell>
                            <Text>
                                <Strong>SLA of Critical Issue</Strong>
                            </Text>
                        </Cell>
                        <Cell>
                            <Text>
                                <Strong>SLA of High Issue</Strong>
                            </Text>
                        </Cell>
                        <Cell>
                            <Text>
                                <Strong>SLA of Medium Issue</Strong>
                            </Text>
                        </Cell>
                        <Cell>
                            <Text>
                                <Strong>SLA of Low Issue</Strong>
                            </Text>
                        </Cell>
                        <Cell>
                            <Text>
                                <Strong>First Escalation</Strong>
                            </Text>
                        </Cell>
                        <Cell>
                            <Text>
                                <Strong>Second Escalation</Strong>
                            </Text>
                        </Cell>
                    </Head>
                    <Row>
                        <Cell><Text>{startTime + " - " + endTime} </Text></Cell>

                        <Cell><Text>{criticalSla}</Text></Cell>
                        <Cell><Text>{highSla}</Text></Cell>
                        <Cell><Text>{mediumSla}</Text></Cell>
                        <Cell><Text>{lowSla}</Text></Cell>
                        <Cell><Text><User accountId={escalation1}/></Text></Cell>
                        <Cell><Text><User accountId={escalation2}/></Text></Cell>
                    </Row>
                </Table>
                <Text>
                    <Strong> Working Days:</Strong>{workingDays}
                </Text>
            </Fragment>
        )
    }

    const renderConfigPage = () => {

        return (
            <Fragment><Form onSubmit={onProjectConfigSubmit}>
            {renderWorkingHoursAndDays()}
            {renderSLAMapping()}
            {renderEscalationMatrix()}
        </Form>
            </Fragment>)

    }

    const renderSuccessMessageAndTable = () => {
    return(    <Fragment>
            <SectionMessage title="Configuration Saved" appearance="confirmation"/>
            {renderConfigTableAfterSlaSubmit()}
        </Fragment>
    )
    }

    return (
        <Fragment>
            { !projectKey ? renderProjectPicker()  : (isProjectAlreadyConfigured && configTableNotSeen) ? renderConfigTable() :  configureButtonClicked ? renderConfigPage() : renderConfigPage() }
            {isProjectConfigSubmitted && renderSuccessMessageAndTable()}
        </Fragment>
    );
};

export const run = render(
    <AdminPage>
        <App />
    </AdminPage>
);
