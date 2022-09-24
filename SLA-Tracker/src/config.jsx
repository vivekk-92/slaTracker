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
    TextArea
} from '@forge/ui';
import {TIME_OPTIONS, STORAGE_KEY_PREFIX, Week_DAYS, ISSUE_SEVERITY} from './constants';


import { storage } from '@forge/api';

const App = () => {
    const [isConfigSubmitted, setConfigSubmitted] = useState(false);

    const onConfigSubmit = async (config) => {
        await storage.set(`${STORAGE_KEY_PREFIX}`, config);
        const storageData = await storage.get(`${STORAGE_KEY_PREFIX}`);
        console.log(storageData)
        setConfigSubmitted(true);
    };

    const renderWorkingHours = (shiftLabel, shiftName) => (
        <Select label= {shiftLabel} name={shiftName}>
            {Object.values(TIME_OPTIONS).map(option => <Option label={option + " AM"} value={option + " AM"} />)}
            {Object.values(TIME_OPTIONS).map(option => <Option label={option + " PM"} value={option + " PM"} />)}
        </Select>
    )

    const renderWorkingDays = () => (
        <Select label= "Choose Working Days of a week" name="WorkingDays" isMulti={true}>
            {Object.values(Week_DAYS).map(option => <Option label={option} value={option} />)}
        </Select>
    )

    const renderSLAMapping = () => (
        <Table>
            <Head>
                <Cell>
                    <Text>Please provide SLA mapping for the issues</Text>
                </Cell>
            </Head>
            <Row>
                <Cell>
                    <Text>Issue Severity</Text>
                </Cell>
                <Cell>
                    <Text>SLA</Text>
                </Cell>
            </Row>
            {Object.values(ISSUE_SEVERITY).map(issue => (
                <Row>
                    <Cell>
                        <Text>{issue}</Text>
                    </Cell>
                    <Cell>
                        <TextField label="" name={issue} />
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
                        <UserPicker label="Escalation Level 1" name="escalationLevel1" />
                    </Cell>
                </Row>
            <Row>
                <Cell>
                    <UserPicker label="Escalation Level 2" name="escalationLevel2" />
                </Cell>
            </Row>
        </Table>
    )

    return (
        <Fragment>
            {isConfigSubmitted && <SectionMessage title="Configuration Saved" appearance="confirmation"/>}
            {<Form onSubmit={onConfigSubmit}>
                {renderWorkingHoursAndDays()}
                {renderSLAMapping()}
                {renderEscalationMatrix()}
            </Form>}
        </Fragment>
    );
};

export const run = render(
    <AdminPage>
        <App />
    </AdminPage>
);
