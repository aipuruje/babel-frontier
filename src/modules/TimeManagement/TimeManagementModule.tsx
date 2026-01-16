import TheoryContent from './TheoryContent';
import PracticeExercise from './PracticeExercise';
import BattleMode from './BattleMode';
import './TimeManagement.css';

interface TimeManagementModuleProps {
    activeTab: 'theory' | 'practice' | 'battle';
}

export default function TimeManagementModule({ activeTab }: TimeManagementModuleProps) {
    return (
        <div className="time-management-module">
            {activeTab === 'theory' && <TheoryContent />}
            {activeTab === 'practice' && <PracticeExercise />}
            {activeTab === 'battle' && <BattleMode />}
        </div>
    );
}
