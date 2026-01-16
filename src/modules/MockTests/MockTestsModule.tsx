import TheoryContent from './TheoryContent';
import PracticeExercise from './PracticeExercise';
import BattleMode from './BattleMode';
import './MockTests.css';

interface MockTestsModuleProps {
    activeTab: 'theory' | 'practice' | 'battle';
}

export default function MockTestsModule({ activeTab }: MockTestsModuleProps) {
    return (
        <div className="mock-tests-module">
            {activeTab === 'theory' && <TheoryContent />}
            {activeTab === 'practice' && <PracticeExercise />}
            {activeTab === 'battle' && <BattleMode />}
        </div>
    );
}
